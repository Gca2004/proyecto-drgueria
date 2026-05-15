const express = require('express');
const router = express.Router();
const {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarPedido,
  eliminarPedido
} = require('../controllers/pedidoController');

router.post('/', crearPedido);
router.get('/', obtenerPedidos);
router.get('/:id', obtenerPedidoPorId);
router.put('/:id', actualizarPedido);
router.delete('/:id', eliminarPedido);

module.exports = router;