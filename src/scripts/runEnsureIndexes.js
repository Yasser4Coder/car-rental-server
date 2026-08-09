import { sequelize } from '../models/index.js';
import { ensureSearchIndexes } from './ensureSearchIndexes.js';

async function main() {
  await sequelize.authenticate();
  await ensureSearchIndexes();
  console.log('Search indexes ready');
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
