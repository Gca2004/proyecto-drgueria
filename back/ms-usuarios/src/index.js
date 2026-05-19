// Carga el .env PRIMERO antes que todo lo demás
require('dotenv').config();

const express = require('express');
const sequelize = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

app.use(cors());          // permite peticiones desde otros orígenes
app.use(morgan('dev'));   // muestra en consola: POST /usuarios 201 10ms
app.use(express.json()); // permite recibir JSON en el body

// Registramos las rutas
const usuarioRoutes = require('./routes/usuarioRoutes');
app.use('/usuarios', usuarioRoutes);

// Ruta raíz para verificar que el servicio funciona
app.get('/', (req, res) => {
  res.json({ mensaje: 'MS Usuarios funcionando correctamente' });
});

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'ok',
      service: 'ms-usuarios',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'ms-usuarios',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});
// Conectamos a MySQL y arrancamos el servidor
sequelize.authenticate()
  .then(() => {
    console.log('Conectado a MySQL - drgueria_usuarios');
    return sequelize.sync(); // crea las tablas si no existen
  })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`MS Usuarios corriendo en http://192.168.100.2:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar con MySQL:', err);
  });