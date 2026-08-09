import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { jsonArrayAttr } from '../utils/jsonField.js';

class Car extends Model {}

Car.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(160), allowNull: false },
    brand: { type: DataTypes.STRING(80), allowNull: false },
    model: { type: DataTypes.STRING(120), allowNull: false },
    year: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: {
      type: DataTypes.ENUM('essential', 'premium', 'prestige', 'supercar'),
      allowNull: false,
    },
    price: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    deposit: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    dailyKm: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 250,
      field: 'daily_km',
    },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    image: { type: DataTypes.STRING(500), allowNull: false },
    gallery: jsonArrayAttr(DataTypes, 'gallery'),
    alt: { type: DataTypes.STRING(255), allowNull: true },
    color: { type: DataTypes.STRING(80), allowNull: true },
    transmission: { type: DataTypes.STRING(80), allowNull: true },
    seats: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 2 },
    doors: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 2 },
    powertrain: { type: DataTypes.STRING(40), allowNull: true },
    drivetrain: { type: DataTypes.STRING(40), allowNull: true },
    horsepower: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    acceleration: { type: DataTypes.STRING(40), allowNull: true },
    topSpeed: { type: DataTypes.STRING(40), allowNull: true, field: 'top_speed' },
    fuel: { type: DataTypes.STRING(120), allowNull: true },
    rating: { type: DataTypes.DECIMAL(2, 1), allowNull: false, defaultValue: 5.0 },
    reviews: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    description: { type: DataTypes.TEXT, allowNull: true },
    highlights: jsonArrayAttr(DataTypes, 'highlights'),
    features: jsonArrayAttr(DataTypes, 'features'),
    included: jsonArrayAttr(DataTypes, 'included'),
    requirements: jsonArrayAttr(DataTypes, 'requirements'),
    badges: jsonArrayAttr(DataTypes, 'badges'),
    locations: jsonArrayAttr(DataTypes, 'locations'),
  },
  {
    sequelize,
    modelName: 'Car',
    tableName: 'cars',
    indexes: [
      { name: 'idx_cars_active_type_price', fields: ['is_active', 'type', 'price'] },
      { name: 'idx_cars_active_featured_price', fields: ['is_active', 'featured', 'price'] },
      { name: 'idx_cars_brand_prefix', fields: ['brand'] },
      { name: 'idx_cars_name_prefix', fields: ['name'] },
      { name: 'idx_cars_model_prefix', fields: ['model'] },
      { fields: ['price'] },
    ],
  },
);

export default Car;
