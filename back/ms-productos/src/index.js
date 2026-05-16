// Carga el .env PRIMERO, antes de todo
require('dotenv').config();

const express = require('express');
const sequelize = require('./config/db');

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
// Permite recibir JSON en el body de las peticiones
app.use(express.json());

// Registramos las rutas
const productoRoutes = require('./routes/productoRoutes');
app.use('/productos', productoRoutes);

// Ruta raíz para verificar que el servicio funciona
app.get('/', (req, res) => {
  res.json({ mensaje: 'MS Productos funcionando correctamente' });
});

  // Asociación Sequelize para el JOIN del carrito
const Carrito = require('./models/Carrito');
const Producto = require('./models/Producto');
Carrito.belongsTo(Producto, { foreignKey: 'producto_id' });

// Rutas del carrito
const carritoRoutes = require('./routes/carritoRoutes');
app.use('/productos/carrito', carritoRoutes);

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


// Conectamos a MySQL y arrancamos el servidor
sequelize.authenticate()
  .then(() => {
    console.log('Conectado a MySQL - drgueria_productos');
    return sequelize.sync(); // sincroniza el modelo con la tabla
  })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`MS Productos corriendo en http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar con MySQL:', err);
  });