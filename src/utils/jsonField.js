/** Parse MySQL/Sequelize JSON that may arrive as a string. */
export function parseJsonField(value, fallback = []) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function jsonArrayAttr(DataTypes, fieldName, defaultValue = []) {
  return {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue,
    get() {
      return parseJsonField(this.getDataValue(fieldName), defaultValue);
    },
    set(value) {
      const parsed =
        typeof value === 'string' ? parseJsonField(value, defaultValue) : (value ?? defaultValue);
      this.setDataValue(fieldName, Array.isArray(parsed) ? parsed : defaultValue);
    },
  };
}
