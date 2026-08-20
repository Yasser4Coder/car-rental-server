import sequelize from '../config/database.js';
import { DEFAULT_VEHICLE_CATEGORIES } from '../config/vehicleCategories.js';

export async function ensureVehicleCategoriesTable() {
  const [tables] = await sequelize.query(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'vehicle_categories'
     LIMIT 1`,
  );

  if (!tables?.length) {
    console.log('[schema] Creating vehicle_categories table…');
    await sequelize.query(`
      CREATE TABLE \`vehicle_categories\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`type\` ENUM('essential','premium','prestige','supercar') NOT NULL,
        \`title\` VARCHAR(120) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`image\` VARCHAR(512) NULL,
        \`icon\` VARCHAR(64) NOT NULL DEFAULT 'directions_car',
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME NOT NULL,
        \`updated_at\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_vehicle_categories_type\` (\`type\`),
        KEY \`idx_vehicle_categories_active_sort\` (\`is_active\`, \`sort_order\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } else {
    console.log('[schema] vehicle_categories table already present');
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  for (const item of DEFAULT_VEHICLE_CATEGORIES) {
    const [existing] = await sequelize.query(
      `SELECT id FROM vehicle_categories WHERE type = ? LIMIT 1`,
      { replacements: [item.type] },
    );
    if (existing?.length) continue;
    await sequelize.query(
      `INSERT INTO vehicle_categories
        (type, title, description, image, icon, sort_order, is_active, created_at, updated_at)
       VALUES (?, ?, ?, NULL, ?, ?, 1, ?, ?)`,
      {
        replacements: [
          item.type,
          item.title,
          item.description,
          item.icon,
          item.sort_order,
          now,
          now,
        ],
      },
    );
    console.log(`[schema] seeded vehicle category: ${item.type}`);
  }

  return true;
}
