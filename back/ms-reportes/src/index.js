require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const reporteRoutes = require('./routes/reporteRoutes');

app.use('/reportes', reporteRoutes);
app.use('/reportes/archivos', express.static(path.join(__dirname, '..', 'output')));

app.get('/', (req, res) => {
  res.json({ mensaje: 'MS Reportes funcionando correctamente' });
});

app.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ms-reportes',
    timestamp: new Date().toISOString(),
    mode: 'analytics'
  });
});

app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.message);
  res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: err.message
  });
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
  console.log(`MS Reportes corriendo en http://192.168.100.2:${PORT}`);
});
