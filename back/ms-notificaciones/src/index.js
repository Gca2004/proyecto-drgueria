require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./config/db');

const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Peticiones HTTP totales
const httpRequestCounter = new client.Counter({
  name: 'ms_notificaciones_http_requests_total',
  help: 'Total de peticiones HTTP al ms-notificaciones',
  labelNames: ['method', 'route', 'status']
});

// Duración de peticiones
const httpRequestDuration = new client.Histogram({
  name: 'ms_notificaciones_http_duration_seconds',
  help: 'Duración de peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const notificacionesRoutes = require('./routes/notificaciones');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
    end({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

app.use('/notificaciones', notificacionesRoutes);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'ok',
      service: 'ms-notificaciones',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'ms-notificaciones',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

sequelize.sync().then(() => {
  console.log('Base de datos sincronizada');
});

const server = app.listen(PORT, () => {
  console.log(`ms-notificaciones corriendo en http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Señal SIGTERM recibida. Cerrando servidor...');
  server.close(() => {
    console.log('Peticiones en curso finalizadas.');
    sequelize.close().then(() => {
      console.log('Conexión a base de datos cerrada.');
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.error('Forzando cierre por timeout.');
    process.exit(1);
  }, 10000);
});