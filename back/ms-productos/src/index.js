// Carga el .env PRIMERO, antes de todo
require('dotenv').config();

const express = require('express');
const sequelize = require('./config/db');

const app = express();

// Permite recibir JSON en el body de las peticiones
app.use(express.json());

// Registramos las rutas
const productoRoutes = require('./routes/productoRoutes');
app.use('/productos', productoRoutes);

// Ruta raíz para verificar que el servicio funciona
app.get('/', (req, res) => {
  res.json({ mensaje: 'MS Productos funcionando correctamente' });
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