import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppBootstrap, Car, sequelize } from '../models/index.js';
import { ensureSearchIndexes } from './ensureSearchIndexes.js';
import { ensureFleetAssets, getUploadsRoot } from './ensureFleetAssets.js';
import { fleetPath, seedDatabase } from '../seeders/seed.js';
import { backfillCarSlugs, ensureCarSlugColumn } from '../utils/carSlug.js';
import { ensurePaymentsTable } from '../utils/ensurePaymentsTable.js';
import { ensurePopularCarColumns } from '../utils/ensurePopularCarColumns.js';
import { ensureWhyChooseUsTable } from '../utils/ensureWhyChooseUsTable.js';
import { ensureVehicleCategoriesTable } from '../utils/ensureVehicleCategoriesTable.js';
import { ensureSeoContentsTable } from '../utils/ensureSeoContentsTable.js';
import { expireStalePendingPaymentBookings } from '../services/bookingPaymentTimeout.js';
import { env } from '../config/env.js';
import { isStripeConfigured } from '../config/stripe.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const importScript = path.join(__dirname, '../seeders/importFleetFromPdf.py');

const STEPS = {
  indexes: 'indexes',
  fleetImport: 'fleet_import',
  seed: 'seed',
};

async function hasRun(key) {
  const row = await AppBootstrap.findByPk(key);
  return Boolean(row);
}

async function markRun(key, note = null) {
  await AppBootstrap.upsert({
    key,
    completedAt: new Date(),
    note,
  });
}

function runPythonImport() {
  return new Promise((resolve, reject) => {
    const candidates = process.platform === 'win32' ? ['python', 'py', 'python3'] : ['python3', 'python'];
    let tried = 0;

    const tryNext = () => {
      if (tried >= candidates.length) {
        reject(new Error('Python not found (tried python / py / python3)'));
        return;
      }
      const cmd = candidates[tried++];
      const child = spawn(cmd, [importScript], {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit',
        shell: process.platform === 'win32',
      });

      child.on('error', () => tryNext());
      child.on('exit', (code) => {
        if (code === 0) resolve();
        else if (code === 9009 || code === 127) tryNext();
        else reject(new Error(`fleet:import exited with code ${code}`));
      });
    };

    tryNext();
  });
}

/** Fast: only mark flags / skip python. Never downloads photos. */
async function bootstrapFleetImportMeta() {
  if (await hasRun(STEPS.fleetImport)) {
    console.log('[bootstrap] fleet:import flag already set — skip');
    return;
  }

  if (fs.existsSync(fleetPath)) {
    console.log('[bootstrap] fleetFromPdf.json present — mark fleet:import done');
    await markRun(STEPS.fleetImport, 'json already present');
    return;
  }

  // Optional python import only if JSON missing (can be slow — only first deploy)
  console.log('[bootstrap] Running fleet:import (first time)…');
  try {
    await runPythonImport();
    if (!fs.existsSync(fleetPath)) {
      throw new Error('fleet:import finished but fleetFromPdf.json was not created');
    }
    await markRun(STEPS.fleetImport, 'python import');
    console.log('[bootstrap] fleet:import complete');
  } catch (err) {
    console.warn(`[bootstrap] fleet:import skipped: ${err.message}`);
  }
}

async function bootstrapIndexes() {
  if (await hasRun(STEPS.indexes)) {
    console.log('[bootstrap] indexes already done — skip');
    return;
  }
  console.log('[bootstrap] Creating search indexes (first time)…');
  await ensureSearchIndexes();
  await markRun(STEPS.indexes, 'search indexes');
  console.log('[bootstrap] indexes complete');
}

async function bootstrapSeed() {
  if (await hasRun(STEPS.seed)) {
    console.log('[bootstrap] seed already done — skip');
    return;
  }

  const carCount = await Car.count();
  if (carCount > 0 && fs.existsSync(fleetPath)) {
    console.log(`[bootstrap] ${carCount} cars already in DB — mark seed done`);
    await seedDatabase({ forceCars: false });
    await markRun(STEPS.seed, 'existing cars');
    return;
  }

  if (!fs.existsSync(fleetPath)) {
    console.warn('[bootstrap] seed deferred — fleetFromPdf.json missing');
    return;
  }

  console.log('[bootstrap] Running db:seed (first time)…');
  await seedDatabase({ forceCars: false });
  await markRun(STEPS.seed, 'initial seed');
  console.log('[bootstrap] seed complete');
}

/**
 * Fast startup work only (must finish before Hostinger's ~3s listen deadline).
 * Photo downloads happen later via runBackgroundJobs().
 */
export async function runBootstrap() {
  const force = process.env.FORCE_BOOTSTRAP === '1' || process.env.FORCE_BOOTSTRAP === 'true';

  // Alter existing tables before sync() tries to add indexes on new columns
  try {
    await ensurePopularCarColumns();
  } catch (err) {
    console.error(`[bootstrap] ensurePopularCarColumns failed: ${err.message}`);
    throw err;
  }

  try {
    await ensureWhyChooseUsTable();
  } catch (err) {
    console.error(`[bootstrap] ensureWhyChooseUsTable failed: ${err.message}`);
    throw err;
  }

  try {
    await ensureVehicleCategoriesTable();
  } catch (err) {
    console.error(`[bootstrap] ensureVehicleCategoriesTable failed: ${err.message}`);
    throw err;
  }

  try {
    await ensureSeoContentsTable();
  } catch (err) {
    console.error(`[bootstrap] ensureSeoContentsTable failed: ${err.message}`);
    throw err;
  }

  await sequelize.sync();
  console.log(`[bootstrap] uploads dir: ${getUploadsRoot()}`);

  // Must run every boot: sync() won't add new columns on existing Hostinger tables
  try {
    await ensureCarSlugColumn();
  } catch (err) {
    console.error(`[bootstrap] ensureCarSlugColumn failed: ${err.message}`);
    throw err;
  }

  try {
    await ensurePaymentsTable();
  } catch (err) {
    console.error(`[bootstrap] ensurePaymentsTable failed: ${err.message}`);
    throw err;
  }

  if (force) {
    console.log('[bootstrap] FORCE_BOOTSTRAP=1 — clearing bootstrap flags');
    await AppBootstrap.destroy({ where: {} });
  }

  await bootstrapIndexes();
  await bootstrapFleetImportMeta();
  await bootstrapSeed();

  try {
    const filled = await backfillCarSlugs();
    if (filled) console.log(`[bootstrap] backfilled ${filled} car slugs`);
  } catch (err) {
    console.warn(`[bootstrap] slug backfill skipped: ${err.message}`);
  }

  try {
    const featuredCount = await Car.count({ where: { featured: true, isActive: true } });
    if (featuredCount === 0) {
      const pick = await Car.findAll({
        where: { isActive: true },
        order: [
          ['price', 'DESC'],
          ['id', 'ASC'],
        ],
        limit: 12,
      });
      for (const car of pick) {
        await car.update({ featured: true });
      }
      if (pick.length) {
        console.log(`[bootstrap] marked ${pick.length} cars as featured (none were set)`);
      }
    }
  } catch (err) {
    console.warn(`[bootstrap] ensure featured skipped: ${err.message}`);
  }

  try {
    const popularCount = await Car.count({ where: { showInPopular: true, isActive: true } });
    if (popularCount === 0) {
      const badges = ['most_booked', 'best_seller', 'new_arrival', 'limited_availability', 'most_booked', 'best_seller'];
      const pick = await Car.findAll({
        where: { isActive: true },
        order: [
          ['featured', 'DESC'],
          ['price', 'DESC'],
          ['id', 'ASC'],
        ],
        limit: 6,
      });
      for (let i = 0; i < pick.length; i += 1) {
        await pick[i].update({
          showInPopular: true,
          popularBadge: badges[i] || 'most_booked',
          popularSort: (i + 1) * 10,
        });
      }
      if (pick.length) {
        console.log(`[bootstrap] marked ${pick.length} cars for Most Popular strip`);
      }
    }
  } catch (err) {
    console.warn(`[bootstrap] ensure popular skipped: ${err.message}`);
  }
}

/** Slow jobs after listen() — restore missing Drive photos + payment timeouts. */
export function runBackgroundJobs() {
  ensureFleetAssets()
    .then((result) => {
      if (result?.downloaded) {
        console.log(`[bootstrap] background fleet-assets downloaded ${result.downloaded}`);
      }
    })
    .catch((err) => {
      console.warn(`[bootstrap] background fleet-assets failed: ${err.message}`);
    });

  const runTimeout = () => {
    expireStalePendingPaymentBookings().catch((err) => {
      console.warn(`[booking-timeout] job failed: ${err.message}`);
    });
  };

  // First pass shortly after boot, then every 5 minutes
  setTimeout(runTimeout, 15_000);
  setInterval(runTimeout, 5 * 60 * 1000);

  if (isStripeConfigured()) {
    console.log(
      `[bootstrap] Stripe configured — unpaid bookings auto-cancel after ${env.bookingPaymentTimeoutMinutes}m`,
    );
  }
}
