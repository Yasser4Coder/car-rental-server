import sequelize from '../config/database.js';

/**
 * Ensure search/filter indexes that Sequelize model defs may not create
 * (especially MySQL FULLTEXT).
 */
export async function ensureSearchIndexes() {
  const statements = [
    // Cars — filter composites + text search
    `CREATE INDEX idx_cars_active_type_price ON cars (is_active, type, price)`,
    `CREATE INDEX idx_cars_active_featured_price ON cars (is_active, featured, price)`,
    `CREATE INDEX idx_cars_brand_prefix ON cars (brand)`,
    `CREATE INDEX idx_cars_name_prefix ON cars (name)`,
    `CREATE INDEX idx_cars_model_prefix ON cars (model)`,
    `CREATE FULLTEXT INDEX ft_cars_name_brand_model ON cars (name, brand, model)`,

    // Bookings — availability + admin filters
    `CREATE INDEX idx_bookings_status_car_pickup ON bookings (status, car_id, pickup_date)`,
    `CREATE INDEX idx_bookings_status_pickup_return ON bookings (status, pickup_date, return_date)`,
    `CREATE INDEX idx_bookings_status_location ON bookings (status, location)`,
    `CREATE INDEX idx_bookings_created_at ON bookings (created_at)`,
    `CREATE INDEX idx_bookings_email_prefix ON bookings (email)`,
    `CREATE INDEX idx_bookings_code_prefix ON bookings (code)`,

    // Users
    `CREATE INDEX idx_users_role_active ON users (role, is_active)`,
  ];

  for (const sql of statements) {
    try {
      await sequelize.query(sql);
      console.log(`[indexes] created: ${sql.split(' ON ')[0].replace('CREATE ', '')}`);
    } catch (err) {
      // Duplicate index name / already exists
      const msg = String(err?.original?.code || err?.message || err);
      if (
        msg.includes('ER_DUP_KEYNAME') ||
        msg.includes('Duplicate key') ||
        msg.includes('already exists')
      ) {
        continue;
      }
      // FULLTEXT unsupported on some engines — warn only
      if (msg.includes('ER_UNSUPPORTED') || msg.includes('FULLTEXT')) {
        console.warn(`[indexes] skipped FULLTEXT: ${msg}`);
        continue;
      }
      console.warn(`[indexes] skip: ${msg}`);
    }
  }
}
