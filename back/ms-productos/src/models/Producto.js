const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define('Producto', {
  id_producto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_producto: {
    type: DataTypes.STRING(100),
    allowNull: false  // campo obligatorio
  },
  categoria: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock_actual: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stock_minimo: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  }
}, {
  tableName: 'productos' //  tabla en MySQL
});

module.exports = Producto;