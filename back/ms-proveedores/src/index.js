require('dotenv').config();
const express = require('express');
const sequelize = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

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

sequelize.authenticate()
  .then(() => {
    console.log('Conectado a MySQL - drgueria_proveedores');
    return sequelize.sync();
  })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`MS Proveedores corriendo en http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar con MySQL:', err);
  });