const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
  },
  sizes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sizeChart: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    field: 'size_chart',
  },
  characteristics: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  },
  printNumberEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'print_number_enabled',
  },
  printNameEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'print_name_enabled',
  },
}, {
  tableName: 'products',
  timestamps: true,
});

module.exports = Product;
