require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas peticiones desde esta IP.',
    mensaje: 'Por favor espera un minuto antes de intentar de nuevo.'
  }
});

const limiterCompras = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    error: 'Límite de compras alcanzado.',
    mensaje: 'Máximo 20 compras por minuto.'
  }
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(limiter);
app.use('/v1/compras', limiterCompras);

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

    const payload = JSON.parse(
      Buffer.from(partes[1], 'base64url').toString('utf8')
    );

    return payload.id_usuario || payload.usuario_id || payload.id || null;
  } catch {
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

  if (ruta.includes('/pagos')) {
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
  } catch {
    // No bloquear el gateway
  }
};

app.use((req, res, next) => {
  if (!metodosAuditables.has(req.method)) {
    return next();
  }

  const evento = detectarServicioYAccion(req);

  if (evento) {
    const usuarioId =
      req.body?.usuario_id ||
      req.body?.id_usuario ||
      extraerUsuarioDesdeToken(req.headers.authorization) ||
      null;

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
      res.status(502).json({
        error: `${serviceLabel} no disponible`,
        detalle: err.message
      });
    }
  }
});

// Microservicios
app.use('/v1/usuarios', createProxyMiddleware(buildProxyConfig(
  process.env.MS_USUARIOS_URL,
  '/usuarios',
  'MS Usuarios'
)));

app.use('/v1/productos', createProxyMiddleware(buildProxyConfig(
  process.env.MS_PRODUCTOS_URL,
  '/productos',
  'MS Productos'
)));

app.use('/v1/proveedores', createProxyMiddleware(buildProxyConfig(
  process.env.MS_PROVEEDORES_URL,
  '/proveedores',
  'MS Proveedores'
)));

app.use('/v1/pedidos', createProxyMiddleware(buildProxyConfig(
  process.env.MS_PROVEEDORES_URL,
  '/pedidos',
  'MS Pedidos'
)));

app.use('/v1/compras', createProxyMiddleware(buildProxyConfig(
  process.env.MS_COMPRAS_URL,
  '/compras',
  'MS Compras'
)));

app.use('/v1/pagos', createProxyMiddleware(buildProxyConfig(
  process.env.MS_PAGOS_URL,
  '/pagos',
  'MS Pagos'
)));

app.use('/v1/notificaciones', createProxyMiddleware(buildProxyConfig(
  process.env.MS_NOTIFICACIONES_URL,
  '/notificaciones',
  'MS Notificaciones'
)));

app.use('/v1/auditoria', createProxyMiddleware(buildProxyConfig(
  process.env.MS_AUDITORIA_URL,
  '/auditoria',
  'MS Auditoria'
)));

app.use('/v1/reportes', createProxyMiddleware(buildProxyConfig(
  process.env.MS_REPORTES_URL,
  '/reportes',
  'MS Reportes'
)));

// Compatibilidad
app.use('/usuarios', (req, res) => res.redirect(307, `/v1/usuarios${req.url}`));
app.use('/productos', (req, res) => res.redirect(307, `/v1/productos${req.url}`));
app.use('/proveedores', (req, res) => res.redirect(307, `/v1/proveedores${req.url}`));
app.use('/pedidos', (req, res) => res.redirect(307, `/v1/pedidos${req.url}`));
app.use('/compras', (req, res) => res.redirect(307, `/v1/compras${req.url}`));
app.use('/pagos', (req, res) => res.redirect(307, `/v1/pagos${req.url}`));
app.use('/notificaciones', (req, res) => res.redirect(307, `/v1/notificaciones${req.url}`));
app.use('/auditoria', (req, res) => res.redirect(307, `/v1/auditoria${req.url}`));
app.use('/reportes', (req, res) => res.redirect(307, `/v1/reportes${req.url}`));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'api-gateway',
    version: 'v1',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    ruta_solicitada: req.originalUrl
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 API Gateway corriendo en puerto ${PORT}`);
});