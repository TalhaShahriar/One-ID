// Polyfill BigInt serialization to prevent "TypeError: Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function () {
  const num = Number(this);
  return Number.isSafeInteger(num) ? num : this.toString();
};

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

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

const app = express();
app.set('trust proxy', 1);

// 1. HELMET SECURE HEADERS
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// 2. PARSE BODIES
app.use(express.json());

// 3. CORS CONFIGURATION
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'https://one-id-bd.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    } else {
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true
}));

// 4. RATE LIMITER (1000 req / 15 mins, skip OTP endpoint)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  message: { error: 'Too many requests. Try again in 15 minutes.' }
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many OTP attempts. Try again in 5 minutes.' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/auth/verify-mfa', otpLimiter);

// 5. MODULES / MOUNT ROUTERS
app.use('/api/auth', authRouter);
app.use('/api/voting', votingRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/citizen', citizenRouter);

// Mount Planned Future OneID Modules
app.use('/api/tax', taxRouter);
app.use('/api/vehicle', vehicleRouter);
app.use('/api/property', propertyRouter);
app.use('/api/civil-registry', civilRegistryRouter);

// Legacy route aliases
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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'OneID',
    version: '1.0.0',
    modules: ['voting', 'tax', 'vehicle', 'property', 'civil-registry'],
    system: 'OneID Bangladesh'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  
  let status = err.status || 500;
  let errorName = 'Internal server error.';
  let message = err.message || 'An unexpected error occurred.';

  // Handle Prisma Errors
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      status = 409;
      errorName = 'Conflict';
      message = 'A record with this value already exists.';
    } else if (err.code === 'P2025') {
      status = 404;
      errorName = 'Not Found';
      message = 'The requested record could not be found.';
    } else if (err.code === 'P2003') {
      status = 400;
      errorName = 'Bad Request';
      message = 'Foreign key constraint failed.';
    } else {
      status = 400;
      errorName = 'Bad Request';
      message = 'Database operation failed.';
    }
  } else if (err.name === 'PrismaClientValidationError') {
    status = 400;
    errorName = 'Bad Request';
    message = 'Invalid data provided to database.';
  } else {
    // Map standard HTTP status codes to names
    if (status === 400) errorName = 'Bad Request';
    else if (status === 401) errorName = 'Unauthorized';
    else if (status === 403) errorName = 'Forbidden';
    else if (status === 404) errorName = 'Not Found';
    else if (status === 409) errorName = 'Conflict';
    else if (status === 422) errorName = 'Unprocessable Entity';
  }

  // Ensure safe error messages in production for 5xx errors
  if (process.env.NODE_ENV === 'production' && status >= 500) {
    message = 'Access Restricted: Internal Server Error';
  }

  res.status(status).json({
    error: errorName,
    message: message
  });
});

export default app;
