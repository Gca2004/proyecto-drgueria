const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Carrito = sequelize.define('Carrito', {
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'carrito'
});

module.exports = Carrito;