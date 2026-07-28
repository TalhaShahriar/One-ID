import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

import app from './app.js';

// Background Cron Jobs
import { startScheduler, startAuditVerifier } from './src/modules/voting/voting.cron.js';
import { startAuditCron } from './src/core/audit.cron.js';
import { startCivilScheduler } from './src/modules/future/civil.cron.js';

const httpServer = createServer(app);

// 1. ATTACH SOCKET.IO
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 SecChannel Connected: ${socket.id}`);
  
  socket.on('subscribe_election', (electionId) => {
    socket.join(`election_${electionId}`);
    console.log(`🔔 Socket ${socket.id} subscribed to real-time blocks of election: ${electionId}`);
  });

  socket.on("join:election", (electionId) => {
    socket.join("election:" + electionId);
    console.log(`🔒 Socket ${socket.id} joined room: election:${electionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 SecChannel Disconnected: ${socket.id}`);
  });
});

// 2. API 404 FALLBACK
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint routing target not found in OneID core registry.' });
});

// 3. VITE MIDDLEWARE OR STATIC SERVING
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false },
    appType: "spa",
  });
  app.use(vite.middlewares);

  // Serve transformed index.html for client-side pages in development
  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    try {
      const fs = await import('fs');
      const url = req.originalUrl;
      const htmlPath = path.resolve(process.cwd(), 'index.html');
      let html = fs.readFileSync(htmlPath, 'utf-8');
      html = await vite.transformIndexHtml(url, html);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      next(e);
    }
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 3. BACKGROUND SCHEDULERS
startScheduler(io);
startAuditVerifier(io);
startAuditCron();
startCivilScheduler(io);



const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OneID Bangladesh Server active on http://0.0.0.0:${PORT}`);
});
