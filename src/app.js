import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import carRoutes from './routes/carRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { getUploadsRoot } from './utils/paths.js';

const uploadsPath = getUploadsRoot();

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: [env.clientUrl, env.adminUrl],
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Serve fleet photos at both paths (Hostinger often only proxies /api/* to Node)
const staticOpts = { fallthrough: true, maxAge: '7d', index: false };
app.use('/uploads', express.static(uploadsPath, staticOpts));
app.use('/api/uploads', express.static(uploadsPath, staticOpts));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'car-rental-api',
    uploadsPath,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Stripe webhook stub for later:
// app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), ...)

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
