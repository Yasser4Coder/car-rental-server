import { sequelize } from '../models/index.js';
import { seedDatabase } from './seed.js';

async function main() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  await seedDatabase({ forceCars: process.argv.includes('--force') });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
