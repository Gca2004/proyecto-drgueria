const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificacionesController');

router.get('/', ctrl.obtenerTodas);
router.get('/:id', ctrl.obtenerPorId);
router.get('/usuario/:id', ctrl.obtenerPorUsuario);
router.post('/stock-bajo', ctrl.crearStockBajo);
router.post('/compra', ctrl.crearCompra);
router.post('/pago', ctrl.crearPago);
router.post('/pedido', ctrl.crearPedido);
router.put('/:id/leer', ctrl.marcarLeida);

module.exports = router;