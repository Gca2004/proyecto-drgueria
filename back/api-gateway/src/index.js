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

// MS COMPRAS — Puerto 3003
app.use('/v1/compras', createProxyMiddleware({
  target: process.env.MS_COMPRAS_URL,
  changeOrigin: true,
  pathRewrite: (path) => '/compras' + path,
  on: {
    error: (err, req, res) => {
      console.error('❌ Error proxy MS Compras:', err.message);
      res.status(502).json({ error: 'MS Compras no disponible', detalle: err.message });
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

// MS Auditoria — Puerto 3006
app.use('/v1/auditoria', createProxyMiddleware({
  target: process.env.MS_AUDITORIA_URL,
  changeOrigin: true,
  pathRewrite: (path) => '/auditoria' + path,
  on: {
    error: (err, req, res) => {
      console.error('❌ Error proxy MS Auditoria:', err.message);
      res.status(502).json({ error: 'MS Auditoria no disponible', detalle: err.message });
    }
  }
}));

// MS Reportes — Puerto 3007
app.use('/v1/reportes', createProxyMiddleware({
  target: process.env.MS_REPORTES_URL,
  changeOrigin: true,
  pathRewrite: (path) => '/reportes' + path,
  on: {
    error: (err, req, res) => {
      console.error('❌ Error proxy MS Reportes:', err.message);
      res.status(502).json({ error: 'MS Reportes no disponible', detalle: err.message });
    }
  }
}));









// Compatibilidad sin /v1/
app.use('/usuarios',    (req, res) => res.redirect(307, `/v1/usuarios${req.url}`));
app.use('/productos',   (req, res) => res.redirect(307, `/v1/productos${req.url}`));
app.use('/proveedores', (req, res) => res.redirect(307, `/v1/proveedores${req.url}`));
app.use('/pedidos',     (req, res) => res.redirect(307, `/v1/pedidos${req.url}`));
app.use('/pagos',       (req, res) => res.redirect(307, `/v1/pagos${req.url}`));
app.use('/auditoria',   (req, res) => res.redirect(307, `/v1/auditoria${req.url}`));
app.use('/reportes',    (req, res) => res.redirect(307, `/v1/reportes${req.url}`));
app.use('/compras', (req, res) => res.redirect(307, `/v1/compras${req.url}`));



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
      pagos:       process.env.MS_PAGOS_URL       || 'no configurado',
      auditoria:   process.env.MS_AUDITORIA_URL   || 'no configurado',
      reportes:    process.env.MS_REPORTES_URL    || 'no configurado'
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
      auditoria:   '/v1/auditoria',
      reportes:    '/v1/reportes',
      health:      '/health'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada en el API Gateway',
    ruta_solicitada: req.originalUrl,
    rutas_validas: ['/v1/usuarios', '/v1/productos', '/v1/proveedores', '/v1/pedidos', '/v1/pagos', '/v1/auditoria', '/v1/reportes']
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway corriendo en http://192.168.100.2:${PORT}`);
  console.log(`📋 Rutas activas:`);
  console.log(`   /v1/usuarios    → ${process.env.MS_USUARIOS_URL}`);
  console.log(`   /v1/productos   → ${process.env.MS_PRODUCTOS_URL}`);
  console.log(`   /v1/proveedores → ${process.env.MS_PROVEEDORES_URL}`);
  console.log(`   /v1/pedidos     → ${process.env.MS_PROVEEDORES_URL}`);
  console.log(`   /v1/pagos       → ${process.env.MS_PAGOS_URL}`);
  console.log(`   /v1/auditoria   → ${process.env.MS_AUDITORIA_URL}`);
  console.log(`   /v1/reportes    → ${process.env.MS_REPORTES_URL}`);
});
