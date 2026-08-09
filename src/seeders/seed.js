import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { Booking, Car, User, sequelize } from '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fleetPath = path.join(__dirname, 'fleetFromPdf.json');

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const passwordHash = await bcrypt.hash(env.admin.password, 12);
  const [admin, created] = await User.findOrCreate({
    where: { email: env.admin.email },
    defaults: {
      fullName: env.admin.name,
      email: env.admin.email,
      phone: '+97145550190',
      passwordHash,
      role: 'admin',
      isActive: true,
    },
  });

  if (!created) {
    admin.passwordHash = passwordHash;
    admin.role = 'admin';
    admin.fullName = env.admin.name;
    admin.isActive = true;
    await admin.save();
  }

  if (!fs.existsSync(fleetPath)) {
    throw new Error(
      'Missing fleetFromPdf.json. Run: python src/seeders/importFleetFromPdf.py',
    );
  }

  const fleet = JSON.parse(fs.readFileSync(fleetPath, 'utf8'));
  const bookingCount = await Booking.count();

  if (bookingCount > 0) {
    // Soft-replace: deactivate old cars, insert fleet if empty of active PDF cars
    await Car.update({ isActive: false }, { where: {} });
  } else {
    await Car.destroy({ where: {}, force: true });
  }

  const rows = fleet.map(({ driveFolder, pdfId, ...car }) => ({
    ...car,
    isActive: true,
  }));

  await Car.bulkCreate(rows);
  console.log(`Seeded ${rows.length} cars from Dubai À La Carte PDF`);
  console.log(`Admin ready: ${env.admin.email}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
