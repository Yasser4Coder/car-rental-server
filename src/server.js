import app from './app.js';
import { env } from './config/env.js';
import { sequelize } from './models/index.js';
import { runBackgroundJobs, runBootstrap } from './scripts/bootstrap.js';

async function start() {
  const port = Number(process.env.PORT) || env.port;

  // Bind ASAP — Hostinger proxies return 503 (no CORS headers) if listen() is delayed
  const server = app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });

  try {
    await sequelize.authenticate();
    await runBootstrap();
    runBackgroundJobs();
  } catch (error) {
    console.error('Startup bootstrap failed:', error.message);
    console.error(error);
    // Keep process alive so /api/health can still respond for debugging
  }

  return server;
}

start();

export default app;
