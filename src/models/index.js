import sequelize from '../config/database.js';
import User from './User.js';
import Car from './Car.js';
import Booking from './Booking.js';
import Payment from './Payment.js';
import RefreshToken from './RefreshToken.js';
import AppBootstrap from './AppBootstrap.js';

User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Car.hasMany(Booking, { foreignKey: 'carId', as: 'bookings' });
Booking.belongsTo(Car, { foreignKey: 'carId', as: 'car' });

Booking.hasMany(Payment, { foreignKey: 'bookingId', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { sequelize, User, Car, Booking, Payment, RefreshToken, AppBootstrap };
