// Polyfill BigInt serialization to prevent "TypeError: Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function () {
  const num = Number(this);
  return Number.isSafeInteger(num) ? num : this.toString();
};

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Consolidated Restructured Module Routers
import authRouter from './src/routes/auth.routes.js';
import votingRouter from './src/modules/voting/voting.routes.js';
import ledgerRouter from './src/routes/ledger.routes.js';
import taxRouter from './src/modules/tax/tax.routes.js';
import vehicleRouter from './src/modules/future/vehicle.routes.js';
import propertyRouter from './src/modules/future/property.routes.js';
import civilRegistryRouter from './src/modules/future/civil-registry.routes.js';
import citizenRouter from './src/routes/citizen.routes.js';

// Background Cron Jobs
import { startScheduler, startAuditVerifier } from './src/modules/voting/voting.cron.js';
import { startAuditCron } from './src/core/audit.cron.js';
import { startCivilScheduler } from './src/modules/future/civil.cron.js';

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

// 1. HELMET SECURE HEADERS
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// 2. PARSE BODIES
app.use(express.json());

// 3. CORS CONFIGURATION
app.use(cors({
  origin: true,
  credentials: true
}));

// 4. RATE LIMITER (1000 req / 15 mins, skip OTP endpoint)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  message: { error: 'Cyberdefense limit exceeded. Too many requests. Please try again after 15 minutes.' },
  skip: (req) => {
    return req.path.includes('/verify-otp') || req.originalUrl.includes('/verify-otp');
  }
});

app.use('/api', apiLimiter);

// 5. ATTACH SOCKET.IO
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

// 6. MODULES / MOUNT ROUTERS
app.use('/api/auth', authRouter);
app.use('/api/voting', votingRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/citizen', citizenRouter);

// Mount Planned Future OneID Modules
app.use('/api/tax', taxRouter);
app.use('/api/vehicle', vehicleRouter);
app.use('/api/property', propertyRouter);
app.use('/api/civil-registry', civilRegistryRouter);

// Elegant Backward-Compatibility Wrappers: 
// Maps legacy routes to our new cohesive voting service endpoints automatically.
app.use('/api/elections', (req, res, next) => {
  req.url = '/elections' + req.url;
  votingRouter(req, res, next);
});
app.use('/api/candidates', (req, res, next) => {
  req.url = '/candidates' + req.url;
  votingRouter(req, res, next);
});
app.use('/api/votes', (req, res, next) => {
  req.url = '/votes' + req.url;
  votingRouter(req, res, next);
});
app.use('/api/audit', (req, res, next) => {
  req.url = '/audit' + req.url;
  votingRouter(req, res, next);
});
app.use('/api/anomaly', (req, res, next) => {
  req.url = '/anomaly' + req.url;
  votingRouter(req, res, next);
});
app.use('/api/reports', (req, res, next) => {
  req.url = '/reports' + req.url;
  votingRouter(req, res, next);
});

// Specific OneID Platform Health Checking API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'OneID',
    version: '1.0.0',
    modules: ['voting', 'tax', 'vehicle', 'property', 'civil-registry'],
    system: 'OneID Bangladesh Core Platform Hub Node'
  });
});

// API 404 fallback
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint routing target not found in OneID core registry.' });
});

// Vite middleware setup
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

// 7. BACKGROUND SCHEDULERS
startScheduler(io);
startAuditVerifier(io);
startAuditCron();
startCivilScheduler(io);

// 8. 404 HANDLER
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return next();
  }
  res.status(404).json({ error: 'Endpoint routing target not found in OneID core registry.' });
});

// 9. SECURITY CENTRAL ERROR HANDLER MIDDLEWARE
app.use((err, req, res, next) => {
  console.error('💥 Core API Runtime Fault Record:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: 'An internal OneID Bangladesh service-layer exception occurred.',
    message: process.env.NODE_ENV === 'production' ? 'Access Restricted' : err.message
  });
});

const PORT = 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OneID Bangladesh Server active on http://0.0.0.0:${PORT}`);
});
