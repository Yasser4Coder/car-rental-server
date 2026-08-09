import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Booking extends Model {}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'user_id',
    },
    carId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'car_id',
    },
    fullName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'full_name',
    },
    email: { type: DataTypes.STRING(180), allowNull: false },
    phone: { type: DataTypes.STRING(40), allowNull: false },
    location: { type: DataTypes.STRING(60), allowNull: false },
    pickupDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'pickup_date',
    },
    returnDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'return_date',
    },
    delivery: {
      type: DataTypes.ENUM('self', 'delivery'),
      allowNull: false,
      defaultValue: 'self',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    days: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    dailyRate: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'daily_rate',
    },
    deposit: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    total: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'confirmed',
        'active',
        'completed',
        'cancelled',
        'rejected',
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes',
    },
    statusHistory: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'status_history',
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cancelled_at',
    },
    cancelledBy: {
      type: DataTypes.ENUM('client', 'admin', 'system'),
      allowNull: true,
      field: 'cancelled_by',
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'deposit_held', 'paid', 'refunded'),
      allowNull: false,
      defaultValue: 'unpaid',
      field: 'payment_status',
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'stripe_payment_intent_id',
    },
  },
  {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    indexes: [
      { name: 'idx_bookings_status_pickup', fields: ['status', 'pickup_date'] },
      { name: 'idx_bookings_status_car_pickup', fields: ['status', 'car_id', 'pickup_date'] },
      { name: 'idx_bookings_status_pickup_return', fields: ['status', 'pickup_date', 'return_date'] },
      { name: 'idx_bookings_status_location', fields: ['status', 'location'] },
      { name: 'idx_bookings_created_at', fields: ['created_at'] },
      { name: 'idx_bookings_email_prefix', fields: ['email'] },
      { name: 'idx_bookings_code_prefix', fields: ['code'] },
      { fields: ['car_id'] },
      { fields: ['user_id'] },
    ],
  },
);

export default Booking;
