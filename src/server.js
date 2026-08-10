import app from './app.js';
import { env } from './config/env.js';
import { sequelize } from './models/index.js';
import { runBackgroundJobs, runBootstrap } from './scripts/bootstrap.js';

async function start() {
  try {
    await sequelize.authenticate();

    // Keep this fast — Hostinger kills the process if listen() is not called ~3s
    await runBootstrap();

    const port = Number(process.env.PORT) || env.port;
    app.listen(port, () => {
      console.log(`API listening on port ${port}`);
      // Download missing fleet photos AFTER the server is accepting traffic
      runBackgroundJobs();
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();

// Hostinger / LiteSpeed may require the app export
export default app;
