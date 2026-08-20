import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { stripeWebhook } from './controllers/stripeWebhookController.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import carRoutes from './routes/carRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { getUploadsRoot } from './utils/paths.js';

const uploadsPath = getUploadsRoot();
fs.mkdirSync(uploadsPath, { recursive: true });

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

/** Normalize origins and allow www / non-www variants of client + admin. */
function buildAllowedOrigins() {
  const raw = [env.clientUrl, env.adminUrl, process.env.EXTRA_CORS_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const set = new Set(raw);
  for (const origin of [...set]) {
    try {
      const url = new URL(origin);
      if (url.hostname.startsWith('www.')) {
        set.add(`${url.protocol}//${url.hostname.slice(4)}`);
      } else if (url.hostname.includes('.')) {
        set.add(`${url.protocol}//www.${url.hostname}`);
      }
    } catch {
      // ignore invalid
    }
  }
  return set;
}

const allowedOrigins = buildAllowedOrigins();
console.log('[cors] allowed origins:', [...allowedOrigins].join(', ') || '(none)');

app.use(
  cors({
    origin(origin, callback) {
      // Non-browser / same-origin tools (curl, server-to-server) send no Origin
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.has(normalized)) return callback(null, true);
      console.warn(`[cors] blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
  }),
);

// Ensure preflight always completes quickly through Express (not Hostinger HTML 503)
app.options(/.*/, cors());

/** Stripe webhook must see the raw body for signature verification. */
app.post(
  '/api/payments/stripe/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    Promise.resolve(stripeWebhook(req, res, next)).catch(next);
  },
);

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const staticOpts = {
  fallthrough: false,
  maxAge: '7d',
  index: false,
  dotfiles: 'ignore',
};
app.use('/uploads', express.static(uploadsPath, staticOpts));
app.use('/api/uploads', express.static(uploadsPath, staticOpts));

app.get('/api/health', (_req, res) => {
  const sample = path.join(uploadsPath, 'fleet');
  let fleetFiles = 0;
  try {
    if (fs.existsSync(sample)) {
      fleetFiles = fs.readdirSync(sample, { withFileTypes: true }).filter((d) => d.isDirectory())
        .length;
    }
  } catch {
    // ignore
  }
  res.json({
    ok: true,
    service: 'car-rental-api',
    uploadsPath,
    fleetFolders: fleetFiles,
    corsOrigins: [...allowedOrigins],
    stripeConfigured: Boolean(env.stripeSecretKey),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
