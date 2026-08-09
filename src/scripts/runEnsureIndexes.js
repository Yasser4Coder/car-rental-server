import { sequelize } from '../models/index.js';
import { ensureSearchIndexes } from './ensureSearchIndexes.js';

await sequelize.authenticate();
await ensureSearchIndexes();
console.log('Search indexes ready');
await sequelize.close();
