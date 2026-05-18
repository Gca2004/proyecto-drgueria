require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const morgan        = require('morgan');
const { Sequelize } = require('sequelize');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ── Base de datos ──────────────────────────────────────────────
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

// ── Rutas ──────────────────────────────────────────────────────
app.use('/compras', require('./routes/compras'));

// ── Health check ───────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', service: 'ms-compras', database: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', service: 'ms-compras', database: 'disconnected' });
  }
});

app.get('/', (req, res) => res.json({ mensaje: 'MS Compras funcionando' }));

// ── Manejo de errores global ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no controlado en MS Compras:', err.message);
  res.status(500).json({ error: 'Error interno', mensaje: err.message });
});

// ── Arrancar (una sola vez) ────────────────────────────────────
sequelize.authenticate()
  .then(() => {
    console.log('Conectado a MySQL - drgueria_compras');
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    app.listen(process.env.PORT || 3003, () => {
      console.log(`MS Compras corriendo en puerto ${process.env.PORT || 3003}`);
    });
  })
  .catch(err => console.error('Error al conectar MySQL:', err));