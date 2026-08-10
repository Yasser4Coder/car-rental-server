import sequelize from '../config/database.js';

/**
 * sequelize.sync() may not create new tables reliably on Hostinger after first boot.
 * Ensure `payments` exists with the columns Stripe Checkout needs.
 */
export async function ensurePaymentsTable() {
  const [tables] = await sequelize.query(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'payments'
     LIMIT 1`,
  );

  if (tables?.length) {
    console.log('[schema] payments table already present');
    return false;
  }

  console.log('[schema] Creating payments table…');
  await sequelize.query(`
    CREATE TABLE \`payments\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`booking_id\` INT UNSIGNED NOT NULL,
      \`stripe_payment_intent_id\` VARCHAR(255) NULL,
      \`stripe_checkout_session_id\` VARCHAR(255) NULL,
      \`amount\` INT UNSIGNED NOT NULL,
      \`currency\` CHAR(3) NOT NULL DEFAULT 'AED',
      \`status\` ENUM(
        'pending',
        'processing',
        'succeeded',
        'failed',
        'canceled',
        'refunded_partial',
        'refunded_full'
      ) NOT NULL DEFAULT 'pending',
      \`metadata\` JSON NULL,
      \`created_at\` DATETIME NOT NULL,
      \`updated_at\` DATETIME NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`stripe_payment_intent_id\` (\`stripe_payment_intent_id\`),
      UNIQUE KEY \`stripe_checkout_session_id\` (\`stripe_checkout_session_id\`),
      KEY \`idx_payments_booking_id\` (\`booking_id\`),
      KEY \`idx_payments_status\` (\`status\`),
      CONSTRAINT \`payments_booking_id_fkey\`
        FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\` (\`id\`)
        ON UPDATE CASCADE ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('[schema] payments table created');
  return true;
}
