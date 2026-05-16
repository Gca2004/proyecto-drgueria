const express = require('express');
const router = express.Router();
const {
  agregarAlCarrito,
  verCarrito,
  modificarCantidad,
  eliminarDelCarrito,
  vaciarCarrito
} = require('../controllers/carritoController');

router.post('/', agregarAlCarrito);
router.get('/:usuario_id', verCarrito);
router.put('/:id', modificarCantidad);
router.delete('/vaciar/:usuario_id', vaciarCarrito);
router.delete('/:id', eliminarDelCarrito);

module.exports = router;