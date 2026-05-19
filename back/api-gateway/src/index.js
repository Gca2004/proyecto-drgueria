require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());

const AUDITORIA_URL = process.env.MS_AUDITORIA_URL || 'http://localhost:3006';

const extraerUsuarioDesdeToken = (authorizationHeader) => {
  try {
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authorizationHeader.slice(7);
    const partes = token.split('.');
    if (partes.length < 2) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));
    return payload.id_usuario || payload.usuario_id || payload.id || null;
  } catch (error) {
    return null;
  }
};

const metodosAuditables = new Set(['POST', 'PUT', 'DELETE']);

const sanitizarBody = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return body || {};
  }

  const sensibles = new Set(['clave', 'contrasena', 'password', 'token']);
  const limpio = {};

  for (const [key, value] of Object.entries(body)) {
    if (sensibles.has(String(key).toLowerCase())) {
      limpio[key] = '[REDACTED]';
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      limpio[key] = sanitizarBody(value);
      continue;
    }

    limpio[key] = value;
  }

  return limpio;
};

const detectarServicioYAccion = (req) => {
  const ruta = req.path || '';
  const metodo = req.method;

  if (ruta.includes('/usuarios')) {
    if (ruta.includes('/login')) {
      return { servicio: 'ms-usuarios', accion: 'Login' };
    }

    if (metodo === 'POST') {
      return { servicio: 'ms-usuarios', accion: 'Registro' };
    }

    return { servicio: 'ms-usuarios', accion: 'Modificación de Usuario/Sesión' };
  }

  if (ruta.includes('/productos')) {
    return { servicio: 'ms-productos', accion: `Acción de Producto (${metodo})` };
  }

  if (ruta.includes('/proveedores') || ruta.includes('/pedidos')) {
    return { servicio: 'ms-proveedores', accion: `Gestión de Proveedores (${metodo})` };
  }

  if (ruta.includes('/pagos') || ruta.includes('/comprar')) {
    return { servicio: 'ms-pagos', accion: `Transacción Financiera (${metodo})` };
  }

  if (ruta.includes('/compras')) {
    return { servicio: 'ms-compras', accion: `Gestión de Compras (${metodo})` };
  }

  if (ruta.includes('/auditoria')) {
    return { servicio: 'ms-auditoria', accion: `Evento de Auditoría (${metodo})` };
  }

  if (ruta.includes('/reportes')) {
    return { servicio: 'ms-reportes', accion: `Acción de Reporte (${metodo})` };
  }

  return null;
};

const enviarLogAuditoria = async (payload) => {
  try {
    await fetch(`${AUDITORIA_URL}/auditoria/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    // No bloquear ni tumbar el gateway si auditoria no esta disponible.
  }
};

app.use((req, res, next) => {
  if (!metodosAuditables.has(req.method)) {
    next();
    return;
  }

  const evento = detectarServicioYAccion(req);

  if (evento) {
    const usuarioId = req.body?.usuario_id
      || req.body?.id_usuario
      || extraerUsuarioDesdeToken(req.headers.authorization)
      || null;
    const detalle = {
      metodo: req.method,
      ruta: req.originalUrl,
      body: sanitizarBody(req.body)
    };

    void enviarLogAuditoria({
      servicio: evento.servicio,
      accion: evento.accion,
      usuario_id: usuarioId,
      detalle: JSON.stringify(detalle)
    });
  }

  next();
});

const buildProxyConfig = (target, basePath, serviceLabel) => ({
  target,
  changeOrigin: true,
  pathRewrite: (path) => basePath + path,
  on: {
    proxyReq: fixRequestBody,
    error: (err, req, res) => {
      console.error(`❌ Error proxy ${serviceLabel}:`, err.message);
      res.status(502).json({ error: `${serviceLabel} no disponible`, detalle: err.message });
    }
  }
});

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
app.use('/v1/usuarios', createProxyMiddleware(buildProxyConfig(
  process.env.MS_USUARIOS_URL,
  '/usuarios',
  'MS Usuarios'
)));

// MS Productos — Puerto 3001
app.use('/v1/productos', createProxyMiddleware(buildProxyConfig(
  process.env.MS_PRODUCTOS_URL,
  '/productos',
  'MS Productos'
)));

// MS Proveedores — Puerto 3002
app.use('/v1/proveedores', createProxyMiddleware(buildProxyConfig(
  process.env.MS_PROVEEDORES_URL,
  '/proveedores',
  'MS Proveedores'
)));

// MS Pedidos — Puerto 3002 (viven en MS Proveedores)
app.use('/v1/pedidos', createProxyMiddleware(buildProxyConfig(
  process.env.MS_PROVEEDORES_URL,
  '/pedidos',
  'MS Pedidos'
)));

// MS COMPRAS — Puerto 3003
app.use('/v1/compras', createProxyMiddleware(buildProxyConfig(
  process.env.MS_COMPRAS_URL,
  '/compras',
  'MS Compras'
)));

// MS Pagos — Puerto 3004
app.use('/v1/pagos', createProxyMiddleware(buildProxyConfig(
  process.env.MS_PAGOS_URL,
  '/pagos',
  'MS Pagos'
)));

// MS Auditoria — Puerto 3006
app.use('/v1/auditoria', createProxyMiddleware(buildProxyConfig(
  process.env.MS_AUDITORIA_URL,
  '/auditoria',
  'MS Auditoria'
)));

// MS Reportes — Puerto 3007
app.use('/v1/reportes', createProxyMiddleware(buildProxyConfig(
  process.env.MS_REPORTES_URL,
  '/reportes',
  'MS Reportes'
)));









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
