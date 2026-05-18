const express = require('express');
const router  = express.Router();
const { crearCompra, obtenerCompras, obtenerCompraPorId, obtenerHistorialUsuario, resumenHoy } = require('../controllers/comprasController');

router.post('/checkout', crearCompra);   // POST /compras/checkout
router.post('/',         crearCompra);   // POST /compras
router.get('/resumen-hoy',          resumenHoy);
router.get('/',          obtenerCompras);
router.get('/usuario/:usuario_id', obtenerHistorialUsuario);
router.get('/:id',       obtenerCompraPorId);

module.exports = router;