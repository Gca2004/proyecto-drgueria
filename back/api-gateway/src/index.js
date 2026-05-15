require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// ✅ CORS primero, una sola vez
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));

// Usuarios
app.use('/usuarios', createProxyMiddleware({
  target: process.env.MS_USUARIOS_URL,
  changeOrigin: true,
  pathRewrite: { '^/': '/usuarios/' }
}));

// Productos
app.use('/productos', createProxyMiddleware({
  target: process.env.MS_PRODUCTOS_URL,
  changeOrigin: true,
  pathRewrite: { '^/': '/productos/' }
}));

// Proveedores
app.use('/proveedores', createProxyMiddleware({
  target: process.env.MS_PROVEEDORES_URL,
  changeOrigin: true,
  pathRewrite: { '^/': '/proveedores/' }
}));

// Pedidos ✅ apunta a MS_PROVEEDORES_URL porque los pedidos viven ahí
app.use('/pedidos', createProxyMiddleware({
  target: process.env.MS_PROVEEDORES_URL,
  changeOrigin: true,
  pathRewrite: { '^/': '/pedidos/' }
}));

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Gateway funcionando correctamente',
    microservicios: {
      usuarios: process.env.MS_USUARIOS_URL,
      productos: process.env.MS_PRODUCTOS_URL,
      proveedores: process.env.MS_PROVEEDORES_URL
    }
  });
});

app.listen(process.env.PORT, () => {
  console.log("API Gateway corriendo en http://localhost:${process.env.PORT}");
});