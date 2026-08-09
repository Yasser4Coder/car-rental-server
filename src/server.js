import app from './app.js';
import { env } from './config/env.js';
import { sequelize } from './models/index.js';
import { ensureSearchIndexes } from './scripts/ensureSearchIndexes.js';

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureSearchIndexes();
    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
