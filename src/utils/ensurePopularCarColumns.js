import sequelize from '../config/database.js';
import { POPULAR_BADGE_VALUES } from '../config/popularBadges.js';

/**
 * Add popularity columns used by the homepage “Most Popular Cars” strip.
 * Hostinger sync() often won't alter existing tables.
 */
export async function ensurePopularCarColumns() {
  const [cols] = await sequelize.query(
    `SELECT COLUMN_NAME AS name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'cars'
       AND COLUMN_NAME IN ('show_in_popular', 'popular_badge', 'popular_sort')`,
  );
  const have = new Set((cols || []).map((c) => c.name));
  const enumList = POPULAR_BADGE_VALUES.map((v) => `'${v}'`).join(',');

  if (!have.has('show_in_popular')) {
    await sequelize.query(
      `ALTER TABLE cars ADD COLUMN show_in_popular TINYINT(1) NOT NULL DEFAULT 0 AFTER featured`,
    );
    console.log('[schema] added cars.show_in_popular');
  }
  if (!have.has('popular_badge')) {
    await sequelize.query(
      `ALTER TABLE cars ADD COLUMN popular_badge ENUM(${enumList}) NULL AFTER show_in_popular`,
    );
    console.log('[schema] added cars.popular_badge');
  }
  if (!have.has('popular_sort')) {
    await sequelize.query(
      `ALTER TABLE cars ADD COLUMN popular_sort INT NOT NULL DEFAULT 0 AFTER popular_badge`,
    );
    console.log('[schema] added cars.popular_sort');
  }

  try {
    await sequelize.query(
      `CREATE INDEX idx_cars_active_popular_sort ON cars (is_active, show_in_popular, popular_sort)`,
    );
    console.log('[schema] added idx_cars_active_popular_sort');
  } catch (err) {
    if (!/Duplicate|exists/i.test(err.message)) {
      console.warn(`[schema] popular index skipped: ${err.message}`);
    }
  }

  if (have.has('show_in_popular') && have.has('popular_badge') && have.has('popular_sort')) {
    console.log('[schema] popular car columns already present');
    return false;
  }
  return true;
}
