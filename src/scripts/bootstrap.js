import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppBootstrap, Car, sequelize } from '../models/index.js';
import { ensureSearchIndexes } from './ensureSearchIndexes.js';
import { fleetPath, seedDatabase } from '../seeders/seed.js';

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
        else if (code === 9009 || code === 127) tryNext(); // command not found
        else reject(new Error(`fleet:import exited with code ${code}`));
      });
    };

    tryNext();
  });
}

async function bootstrapFleetImport() {
  if (await hasRun(STEPS.fleetImport)) {
    console.log('[bootstrap] fleet:import already done — skip');
    return;
  }

  if (fs.existsSync(fleetPath)) {
    console.log('[bootstrap] fleetFromPdf.json present — mark fleet:import done');
    await markRun(STEPS.fleetImport, 'json already present');
    return;
  }

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
    // Do not mark complete — will retry next start
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
    // DB already has cars from a previous manual seed — don't wipe, just mark
    console.log(`[bootstrap] ${carCount} cars already in DB — mark seed done`);
    await seedDatabase({ forceCars: false }); // upserts admin only
    await markRun(STEPS.seed, 'existing cars');
    return;
  }

  if (!fs.existsSync(fleetPath)) {
    console.warn('[bootstrap] seed deferred — fleetFromPdf.json missing (run fleet:import)');
    return;
  }

  console.log('[bootstrap] Running db:seed (first time)…');
  await seedDatabase({ forceCars: false });
  await markRun(STEPS.seed, 'initial seed');
  console.log('[bootstrap] seed complete');
}

/**
 * One-time startup tasks: indexes → fleet import → seed.
 * Tracked in `app_bootstrap` so they never re-run unless FORCE_BOOTSTRAP=1.
 */
export async function runBootstrap() {
  const force = process.env.FORCE_BOOTSTRAP === '1' || process.env.FORCE_BOOTSTRAP === 'true';

  await sequelize.sync();

  if (force) {
    console.log('[bootstrap] FORCE_BOOTSTRAP=1 — clearing bootstrap flags');
    await AppBootstrap.destroy({ where: {} });
  }

  await bootstrapIndexes();
  await bootstrapFleetImport();
  await bootstrapSeed();
}
