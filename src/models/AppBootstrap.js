import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AppBootstrap extends Model {}

AppBootstrap.init(
  {
    key: {
      type: DataTypes.STRING(80),
      primaryKey: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'completed_at',
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AppBootstrap',
    tableName: 'app_bootstrap',
    timestamps: false,
  },
);

export default AppBootstrap;
