import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { VEHICLE_CATEGORY_TYPES } from '../config/vehicleCategories.js';

class VehicleCategory extends Model {}

VehicleCategory.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(...VEHICLE_CATEGORY_TYPES),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'directions_car',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    modelName: 'VehicleCategory',
    tableName: 'vehicle_categories',
    indexes: [
      { name: 'idx_vehicle_categories_active_sort', fields: ['is_active', 'sort_order'] },
      { unique: true, name: 'uq_vehicle_categories_type', fields: ['type'] },
    ],
  },
);

export default VehicleCategory;
