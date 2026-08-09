import { AppBootstrap, sequelize } from '../models/index.js';

async function main() {
  await sequelize.authenticate();
  await sequelize.sync();
  await AppBootstrap.destroy({ where: {} });
  console.log('Cleared app_bootstrap flags. Restart the server to re-run one-time setup.');
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
