import { sequelize } from '../models/index.js';

async function sync() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('Database synced');
  process.exit(0);
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
