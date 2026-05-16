require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./config/db');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const pagoRoutes = require('./routes/pagoRoutes');
app.use('/pagos', pagoRoutes);

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', service: 'ms-pagos', timestamp: new Date().toISOString(), database: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', service: 'ms-pagos', timestamp: new Date().toISOString(), database: 'disconnected' });
  }
});

sequelize.authenticate()
  .then(() => {
    console.log('Conectado a MySQL - drgueria_pagos');
    return sequelize.sync();
  })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`MS Pagos corriendo en http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => console.error('Error al conectar con MySQL:', err));