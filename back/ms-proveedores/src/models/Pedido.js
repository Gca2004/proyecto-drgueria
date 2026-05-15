const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Proveedor = require('./Proveedor');

const Pedido = sequelize.define('Pedido', {
  id_pedido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cantidad_solicitada: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estado_pedido: {
    type: DataTypes.ENUM('aceptado', 'en proceso', 'entregado'),
    defaultValue: 'aceptado'
  },
  fecha_pedido: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_entrega: {
    type: DataTypes.DATE
  },
  numero_factura: {
    type: DataTypes.STRING(50)
  }
}, {
  tableName: 'pedidos'
});

Pedido.belongsTo(Proveedor, { foreignKey: 'id_proveedor' });
Proveedor.hasMany(Pedido, { foreignKey: 'id_proveedor' });

module.exports = Pedido;