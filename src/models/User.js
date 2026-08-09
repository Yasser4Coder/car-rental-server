import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class User extends Model {
  toSafeJSON() {
    const json = this.toJSON();
    delete json.passwordHash;
    return json;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'full_name',
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    role: {
      type: DataTypes.ENUM('client', 'admin'),
      allowNull: false,
      defaultValue: 'client',
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
    modelName: 'User',
    tableName: 'users',
    indexes: [{ name: 'idx_users_role_active', fields: ['role', 'is_active'] }],
  },
);

export default User;
