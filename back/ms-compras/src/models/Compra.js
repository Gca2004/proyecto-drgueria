const { DataTypes, Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST,
    port:    process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
  }
);

const Compra = sequelize.define('Compra', {
  id_compra: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true
  },
  usuario_id: {
    type:      DataTypes.INTEGER,
    allowNull: false
  },
  items: {
    type:      DataTypes.TEXT,
    allowNull: false,
    get() {
      const val = this.getDataValue('items');
      return val ? JSON.parse(val) : [];
    },
    set(val) {
      this.setDataValue('items', JSON.stringify(val));
    }
  },
  total: {
    type:      DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  metodo_pago: {
    type:         DataTypes.STRING(50),
    defaultValue: 'efectivo'
  },
  estado: {
    type:         DataTypes.ENUM('pendiente', 'pagado', 'cancelado'),
    defaultValue: 'pagado'
  },
  numero_factura: {
    type:   DataTypes.STRING(100),
    unique: true
  },
  id_transaccion: {
    type:      DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'compras'
});

module.exports = Compra;
