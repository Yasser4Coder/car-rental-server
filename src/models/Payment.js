import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { PAYMENT_STATUSES } from '../config/paymentConstants.js';
import { parseJsonField } from '../utils/jsonField.js';

class Payment extends Model {}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'booking_id',
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'stripe_payment_intent_id',
    },
    stripeCheckoutSessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'stripe_checkout_session_id',
    },
    amount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: 'AED',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_STATUSES)),
      allowNull: false,
      defaultValue: PAYMENT_STATUSES.PENDING,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        return parseJsonField(this.getDataValue('metadata'), null);
      },
      set(value) {
        this.setDataValue('metadata', value ?? null);
      },
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    indexes: [
      { name: 'idx_payments_booking_id', fields: ['booking_id'] },
      { name: 'idx_payments_status', fields: ['status'] },
    ],
  },
);

export default Payment;
