const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  servicio: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  accion: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER
  },
  detalle: {
    type: DataTypes.TEXT
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'logs',
  timestamps: false
});

module.exports = Log;
