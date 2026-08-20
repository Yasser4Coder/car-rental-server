import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class SeoContent extends Model {}

SeoContent.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
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
    modelName: 'SeoContent',
    tableName: 'seo_contents',
    indexes: [{ unique: true, name: 'uq_seo_contents_key', fields: ['key'] }],
  },
);

export default SeoContent;
