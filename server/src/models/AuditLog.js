const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'admin_id',
  },
  adminUsername: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'admin_username',
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'entity_id',
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false,
});

module.exports = AuditLog;
