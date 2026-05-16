const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transaccion = sequelize.define('Transaccion', {
  compra_id:      { type: DataTypes.INTEGER, allowNull: false },
  usuario_id:     { type: DataTypes.INTEGER, allowNull: false },
  monto:          { type: DataTypes.DECIMAL(10,2), allowNull: false },
  estado:         { type: DataTypes.ENUM('pendiente','aprobado','rechazado'), defaultValue: 'pendiente' },
  metodo_pago:    { type: DataTypes.STRING(50), defaultValue: 'efectivo' },
  numero_factura: { type: DataTypes.STRING(100), unique: true }
}, { tableName: 'transacciones' });

module.exports = Transaccion;