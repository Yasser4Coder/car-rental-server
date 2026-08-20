import sequelize from '../config/database.js';

const DEFAULT_ITEMS = [
  {
    title: 'Free Delivery Anywhere in Dubai',
    description: 'We deliver to hotels, airports, homes, and offices.',
    icon: 'local_shipping',
    sort_order: 10,
  },
  {
    title: 'No Hidden Fees',
    description: 'Transparent pricing with no surprises.',
    icon: 'payments',
    sort_order: 20,
  },
  {
    title: 'Luxury Fleet',
    description: 'Latest premium vehicles maintained to the highest standards.',
    icon: 'directions_car',
    sort_order: 30,
  },
  {
    title: '24/7 Concierge',
    description: 'Support whenever you need it.',
    icon: 'support_agent',
    sort_order: 40,
  },
];

export async function ensureWhyChooseUsTable() {
  const [tables] = await sequelize.query(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'why_choose_us_items'
     LIMIT 1`,
  );

  if (!tables?.length) {
    console.log('[schema] Creating why_choose_us_items table…');
    await sequelize.query(`
      CREATE TABLE \`why_choose_us_items\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`title\` VARCHAR(120) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`icon\` VARCHAR(64) NOT NULL DEFAULT 'verified',
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME NOT NULL,
        \`updated_at\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_why_choose_active_sort\` (\`is_active\`, \`sort_order\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } else {
    console.log('[schema] why_choose_us_items table already present');
  }

  const [[{ count }]] = await sequelize.query(
    `SELECT COUNT(*) AS count FROM why_choose_us_items`,
  );
  if (Number(count) === 0) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    for (const item of DEFAULT_ITEMS) {
      await sequelize.query(
        `INSERT INTO why_choose_us_items
          (title, description, icon, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
        {
          replacements: [
            item.title,
            item.description,
            item.icon,
            item.sort_order,
            now,
            now,
          ],
        },
      );
    }
    console.log(`[schema] seeded ${DEFAULT_ITEMS.length} why-choose-us items`);
  }

  return true;
}
