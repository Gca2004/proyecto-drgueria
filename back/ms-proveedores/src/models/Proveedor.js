const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Proveedor = sequelize.define('Proveedor', {
  id_proveedor: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  contacto: {
    type: DataTypes.STRING(100)
  },
  telefono: {
    type: DataTypes.STRING(20)
  },
  categoria: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  tableName: 'proveedores'
});

module.exports = Proveedor;