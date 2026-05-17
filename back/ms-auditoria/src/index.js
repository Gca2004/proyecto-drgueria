require('dotenv').config();
const express = require('express');
const sequelize = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const auditoriaRoutes = require('./routes/auditoriaRoutes');

app.use('/auditoria', auditoriaRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'MS Auditoria funcionando correctamente' });
});

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'ok',
      service: 'ms-auditoria',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'ms-auditoria',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

app.get('/auditoria/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'ok',
      service: 'ms-auditoria',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'ms-auditoria',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.message);
  res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: err.message
  });
});

sequelize.authenticate()
  .then(() => {
    console.log('Conectado a MySQL - drgueria_auditoria');
    return sequelize.sync();
  })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`MS Auditoria corriendo en http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar con MySQL:', err);
  });
