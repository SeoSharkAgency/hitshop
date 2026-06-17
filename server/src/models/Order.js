const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'order_number',
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'customer_name',
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'customer_phone',
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'customer_email',
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('new', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'new',
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
    field: 'payment_status',
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'delivery_address',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'orders',
  timestamps: true,
});

module.exports = Order;
