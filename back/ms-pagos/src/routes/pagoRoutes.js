const express = require('express');
const router = express.Router();
const { crearPago, obtenerPago, pagosPorCompra, pagosPorUsuario, pagosPorFactura, actualizarEstado } = require('../controllers/pagoController');

router.post('/', crearPago);
router.get('/compra/:compra_id', pagosPorCompra);
router.get('/usuario/:usuario_id', pagosPorUsuario);
router.get('/factura/:numero_factura', pagosPorFactura);
router.get('/:id', obtenerPago);
router.put('/:id/estado', actualizarEstado);

module.exports = router;