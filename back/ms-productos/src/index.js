// Carga el .env PRIMERO antes que todo lo demás
require('dotenv').config();

const express = require('express');
const sequelize = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');
const axiosRetry = require('axios-retry').default || require('axios-retry');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ── Retry con backoff exponencial ──────────────────────────────
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    console.log(`Reintento número ${retryCount}`);
    return axiosRetry.exponentialDelay(retryCount);
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error)
      || (error.response && error.response.status >= 500);
  }
});

// ── Modelos y asociaciones ──────────────────────────────────────
const Producto = require('./models/Producto');
const Carrito  = require('./models/Carrito');

// Asociación necesaria para el JOIN en verCarrito
Carrito.belongsTo(Producto, { foreignKey: 'producto_id' });
Producto.hasMany(Carrito,   { foreignKey: 'producto_id' });

// ── Rutas ───────────────────────────────────────────────────────
const productoRoutes = require('./routes/productoRoutes');
const carritoRoutes  = require('./routes/carritoRoutes');

// IMPORTANTE: /productos/carrito ANTES de /productos/:id
// para que Express no confunda "carrito" con un :id numérico
app.use('/productos/carrito', carritoRoutes);
app.use('/productos',         productoRoutes);

// ── Health check ────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'ok',
      service: 'ms-productos',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'ms-productos',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ mensaje: 'MS Productos funcionando correctamente' });
});

// ── Manejo de errores global ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor', mensaje: err.message });
});

// ── Conectar MySQL y arrancar ────────────────────────────────────
sequelize.authenticate()
  .then(() => {
    console.log('Conectado a MySQL - drgueria_productos');
    // sync({ alter: true }) actualiza columnas si cambian los modelos
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`MS Productos corriendo en http://192.168.100.2:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar con MySQL:', err);
  });