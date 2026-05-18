require('dotenv').config();
const express = require('express');
const sequelize = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

const axios = require('axios');
const axiosRetry = require('axios-retry').default;

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    console.log(`Reintento número ${retryCount}`);
    return axiosRetry.exponentialDelay(retryCount);
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error)
      || error.response?.status >= 500;
  }
});

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const proveedorRoutes = require('./routes/proveedorRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');

app.use('/proveedores', proveedorRoutes);
app.use('/pedidos', pedidoRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'MS Proveedores funcionando correctamente' });
});
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'ok',
      service: 'ms-proveedores',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'ms-proveedores',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.message);
  res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: err.message
  });
});

sequelize.authenticate()
  .then(() => {
    console.log('Conectado a MySQL - drgueria_proveedores');
    return sequelize.sync();
  })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`MS Proveedores corriendo en http://192.168.100.2:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar con MySQL:', err);
  });

