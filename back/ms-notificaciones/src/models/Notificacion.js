const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notificacion = sequelize.define('Notificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  estado: {
    type: DataTypes.ENUM('enviada', 'fallida'),
    defaultValue: 'enviada'
  },
  referencia_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  referencia_tipo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notificaciones',
  timestamps: false
});

module.exports = Notificacion;