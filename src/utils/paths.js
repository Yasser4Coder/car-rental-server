import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the uploads directory on disk. */
export function getUploadsRoot() {
  return path.resolve(__dirname, '../../', env.uploadDir || 'uploads');
}

export function localPathFromPublic(publicPath) {
  const cleaned = String(publicPath || '').replace(/^\/uploads\/?/, '');
  return path.join(getUploadsRoot(), cleaned);
}
