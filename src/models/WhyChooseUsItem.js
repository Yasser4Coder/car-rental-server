import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class WhyChooseUsItem extends Model {}

WhyChooseUsItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'verified',
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
    modelName: 'WhyChooseUsItem',
    tableName: 'why_choose_us_items',
    indexes: [{ name: 'idx_why_choose_active_sort', fields: ['is_active', 'sort_order'] }],
  },
);

export default WhyChooseUsItem;
