import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import routes from './routes/index.js';
import authRoutes from './routes/auth.routes.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", ...env.clientOrigins],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (env.clientOrigins.includes(origin)) return callback(null, true);
      if (!env.isProduction && localhostPattern.test(origin)) return callback(null, true);
      return callback(new ApiError(403, 'This origin is not allowed to access the API.'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(sanitizeInput);

if (!env.isTest) {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.isTest,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { message: 'Too many login attempts. Please try again in a few minutes.' },
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'EcoBite API',
    environment: env.nodeEnv,
    simulation: 'Payments, delivery tracking and GPS are simulated for this demo.',
    uptimeSeconds: Math.round(process.uptime()),
    time: new Date().toISOString(),
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', routes);

// Serve the built React app when it exists (single-service deployment).
const clientDist = path.resolve(here, '../../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1h' }));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ message: 'EcoBite API is running. Start the React app with: npm run dev' });
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
