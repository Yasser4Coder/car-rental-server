import sequelize from '../config/database.js';
import { DEFAULT_HOMEPAGE_SEO, HOMEPAGE_SEO_KEY } from '../config/seoContent.js';

export async function ensureSeoContentsTable() {
  const [tables] = await sequelize.query(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'seo_contents'
     LIMIT 1`,
  );

  if (!tables?.length) {
    console.log('[schema] Creating seo_contents table…');
    await sequelize.query(`
      CREATE TABLE \`seo_contents\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`key\` VARCHAR(64) NOT NULL,
        \`title\` VARCHAR(200) NOT NULL,
        \`body\` LONGTEXT NOT NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME NOT NULL,
        \`updated_at\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_seo_contents_key\` (\`key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } else {
    console.log('[schema] seo_contents table already present');
  }

  const [existing] = await sequelize.query(
    `SELECT id FROM seo_contents WHERE \`key\` = ? LIMIT 1`,
    { replacements: [HOMEPAGE_SEO_KEY] },
  );

  if (!existing?.length) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await sequelize.query(
      `INSERT INTO seo_contents (\`key\`, title, body, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?)`,
      {
        replacements: [
          DEFAULT_HOMEPAGE_SEO.key,
          DEFAULT_HOMEPAGE_SEO.title,
          DEFAULT_HOMEPAGE_SEO.body,
          now,
          now,
        ],
      },
    );
    console.log('[schema] seeded homepage SEO content');
  }

  return true;
}
