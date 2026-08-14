const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
  },
}, {
  tableName: 'settings',
  timestamps: true,
});

module.exports = Setting;
