import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { Booking, Car, User } from '../models/index.js';
import { buildCarSlugBase } from '../utils/carSlug.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const fleetPath = path.join(__dirname, 'fleetFromPdf.json');

/**
 * Seed admin + fleet cars.
 * @param {{ forceCars?: boolean }} [options]
 *   forceCars — wipe/replace cars even if some already exist
 */
export async function seedDatabase(options = {}) {
  const { forceCars = false } = options;

  const passwordHash = await bcrypt.hash(env.admin.password, 12);
  const [admin, created] = await User.findOrCreate({
    where: { email: env.admin.email },
    defaults: {
      fullName: env.admin.name,
      email: env.admin.email,
      phone: '+97145550190',
      passwordHash,
      role: 'admin',
      isActive: true,
    },
  });

  if (!created) {
    admin.passwordHash = passwordHash;
    admin.role = 'admin';
    admin.fullName = env.admin.name;
    admin.isActive = true;
    await admin.save();
  }

  const carCount = await Car.count();
  if (carCount > 0 && !forceCars) {
    console.log(`[seed] Admin ready (${env.admin.email}); cars already present (${carCount}), skipping fleet seed`);
    return { adminEmail: env.admin.email, carsSeeded: 0, skippedCars: true };
  }

  if (!fs.existsSync(fleetPath)) {
    throw new Error(
      'Missing fleetFromPdf.json. Run fleet import first (automatic on first boot, or: npm run fleet:import)',
    );
  }

  const fleet = JSON.parse(fs.readFileSync(fleetPath, 'utf8'));
  const bookingCount = await Booking.count();

  if (forceCars || carCount > 0) {
    if (bookingCount > 0) {
      await Car.update({ isActive: false }, { where: {} });
    } else {
      await Car.destroy({ where: {}, force: true });
    }
  }

  const rows = [];
  const usedSlugs = new Set(
    (await Car.findAll({ attributes: ['slug'], raw: true }))
      .map((row) => row.slug)
      .filter(Boolean),
  );

  for (const item of fleet) {
    const { driveFolder, pdfId, ...car } = item;
    const base = buildCarSlugBase(car) || 'car';
    let slug = base;
    let n = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${n}`;
      n += 1;
    }
    usedSlugs.add(slug);
    rows.push({ ...car, slug, isActive: true });
  }

  await Car.bulkCreate(rows);
  console.log(`[seed] Seeded ${rows.length} cars · admin ${env.admin.email}`);
  return { adminEmail: env.admin.email, carsSeeded: rows.length, skippedCars: false };
}
