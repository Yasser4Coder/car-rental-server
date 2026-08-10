import { env } from '../config/env.js';
import { parseJsonField } from './jsonField.js';

/** Absolute public origin for /uploads (e.g. https://api.example.com). Empty = relative. */
export function resolveMediaUrl(src) {
  if (!src || typeof src !== 'string') return src;
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
  const base = String(env.publicUrl || '').replace(/\/$/, '');
  if (!base) return src;
  return src.startsWith('/') ? `${base}${src}` : `${base}/${src}`;
}

export function withCarMedia(car) {
  if (!car) return car;
  const data = typeof car.toJSON === 'function' ? car.toJSON() : { ...car };
  data.image = resolveMediaUrl(data.image);
  data.gallery = parseJsonField(data.gallery, []).map(resolveMediaUrl);
  return data;
}

export function withCarsMedia(cars) {
  return (cars || []).map(withCarMedia);
}
