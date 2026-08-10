import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'DB_NAME', 'DB_USER'];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key} — set it in server/.env`);
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'car_rental',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me-32chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me-32chars',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7),
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',
  /** Public API origin for absolute /uploads URLs in production */
  publicUrl: (process.env.PUBLIC_URL || process.env.API_PUBLIC_URL || '').replace(/\/$/, ''),
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@greenrental.ae',
    password: process.env.ADMIN_PASSWORD || 'Admin123!@#',
    name: process.env.ADMIN_NAME || 'Fleet Admin',
  },
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};
