import { Op } from 'sequelize';
import { Car } from '../models/index.js';

/** Turn a car name into a URL-safe slug: "Audi A3 S-Line" → "audi-a3-s-line" */
export function slugify(input) {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 140);
}

export function buildCarSlugBase(car) {
  const fromName = slugify(car?.name);
  if (fromName.length >= 3) return fromName;
  const parts = [car?.brand, car?.model, car?.year].filter(Boolean).join(' ');
  return slugify(parts) || 'car';
}

/**
 * Ensure a unique slug for create/update.
 * @param {object} carLike - { name, brand, model, year, slug? }
 * @param {number|null} excludeId - car id to ignore when checking uniqueness
 */
export async function ensureUniqueCarSlug(carLike, excludeId = null) {
  const preferred = slugify(carLike.slug) || buildCarSlugBase(carLike);
  const base = preferred || 'car';

  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const where = { slug: candidate };
    if (excludeId != null) {
      where.id = { [Op.ne]: excludeId };
    }
    const exists = await Car.findOne({ where, attributes: ['id'] });
    if (!exists) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}

/** Backfill missing/empty slugs for existing cars (safe to run on every boot). */
export async function backfillCarSlugs() {
  const cars = await Car.findAll({
    attributes: ['id', 'name', 'brand', 'model', 'year', 'slug'],
    order: [['id', 'ASC']],
  });

  let updated = 0;
  for (const car of cars) {
    if (car.slug && String(car.slug).trim()) continue;
    const slug = await ensureUniqueCarSlug(car, car.id);
    await car.update({ slug });
    updated += 1;
  }
  return updated;
}
