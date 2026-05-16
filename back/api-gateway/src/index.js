require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));

let rateLimit;
try {
  rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.' }
  });
  app.use(limiter);
  console.log('✅ Rate limiter activo: 300 req / 15 min');
} catch (e) {
  console.warn('⚠️  express-rate-limit no instalado, continuando sin rate limiting');
}

// MS Usuarios — Puerto 3000
app.use('/v1/usuarios', createProxyMiddleware({
  target: process.env.MS_USUARIOS_URL,
  changeOrigin: true,
  pathRewrite: (path) => '/usuarios' + path,
  on: {
    error: (err, req, res) => {
      console.error('❌ Error proxy MS Usuarios:', err.message);
      res.status(502).json({ error: 'MS Usuarios no disponible', detalle: err.message });
    }
  }
}));

// MS Productos — Puerto 3001
app.use('/v1/productos', createProxyMiddleware({
  target: process.env.MS_PRODUCTOS_URL,
  changeOrigin: true,
  pathRewrite: (path) => '/productos' + path,
  on: {
    error: (err, req, res) => {
      console.error('❌ Error proxy MS Productos:', err.message);
      res.status(502).json({ error: 'MS Productos no disponible', detalle: err.message });
    }
  }
}));

// MS Proveedores — Puerto 3002
app.use('/v1/proveedores', createProxyMiddleware({
  target: process.env.MS_PROVEEDORES_URL,
  changeOrigin: true,
  pathRewrite: (path) => '/proveedores' + path,
  on: {
    error: (err, req, res) => {
      console.error('❌ Error proxy MS Proveedores:', err.message);
      res.status(502).json({ error: 'MS Proveedores no disponible', detalle: err.message });
    }
  }
}));

// MS Pedidos — Puerto 3002 (viven en MS Proveedores)
app.use('/v1/pedidos', createProxyMiddleware({
  target: process.env.MS_PROVEEDORES_URL,
  changeOrigin: true,
  pathRewrite: (path) => '/pedidos' + path,
  on: {
    error: (err, req, res) => {
      console.error('❌ Error proxy MS Pedidos:', err.message);
      res.status(502).json({ error: 'MS Pedidos no disponible', detalle: err.message });
    }
  }
}));

// MS Pagos — Puerto 3004
app.use('/v1/pagos', createProxyMiddleware({
  target: process.env.MS_PAGOS_URL,
  changeOrigin: true,
  pathRewrite: (path) => '/pagos' + path,
  on: {
    error: (err, req, res) => {
      console.error('❌ Error proxy MS Pagos:', err.message);
      res.status(502).json({ error: 'MS Pagos no disponible', detalle: err.message });
    }
  }
}));

// Compatibilidad sin /v1/
app.use('/usuarios',    (req, res) => res.redirect(307, `/v1/usuarios${req.url}`));
app.use('/productos',   (req, res) => res.redirect(307, `/v1/productos${req.url}`));
app.use('/proveedores', (req, res) => res.redirect(307, `/v1/proveedores${req.url}`));
app.use('/pedidos',     (req, res) => res.redirect(307, `/v1/pedidos${req.url}`));
app.use('/pagos',       (req, res) => res.redirect(307, `/v1/pagos${req.url}`));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'api-gateway',
    version: 'v1',
    timestamp: new Date().toISOString(),
    microservicios: {
      usuarios:    process.env.MS_USUARIOS_URL    || 'no configurado',
      productos:   process.env.MS_PRODUCTOS_URL   || 'no configurado',
      proveedores: process.env.MS_PROVEEDORES_URL || 'no configurado',
      pagos:       process.env.MS_PAGOS_URL       || 'no configurado'
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Gateway DRGUERIA funcionando correctamente',
    version: 'v1',
    rutas_disponibles: {
      usuarios:    '/v1/usuarios',
      productos:   '/v1/productos',
      proveedores: '/v1/proveedores',
      pedidos:     '/v1/pedidos',
      pagos:       '/v1/pagos',
      health:      '/health'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada en el API Gateway',
    ruta_solicitada: req.originalUrl,
    rutas_validas: ['/v1/usuarios', '/v1/productos', '/v1/proveedores', '/v1/pedidos', '/v1/pagos']
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway corriendo en http://localhost:${PORT}`);
  console.log(`📋 Rutas activas:`);
  console.log(`   /v1/usuarios    → ${process.env.MS_USUARIOS_URL}`);
  console.log(`   /v1/productos   → ${process.env.MS_PRODUCTOS_URL}`);
  console.log(`   /v1/proveedores → ${process.env.MS_PROVEEDORES_URL}`);
  console.log(`   /v1/pedidos     → ${process.env.MS_PROVEEDORES_URL}`);
  console.log(`   /v1/pagos       → ${process.env.MS_PAGOS_URL}`);
});