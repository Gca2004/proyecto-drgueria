const express = require('express');
const router = express.Router();
const {
  crearProveedor,
  obtenerProveedores,
  obtenerProveedorPorId,
  actualizarProveedor,
  eliminarProveedor,
  obtenerProveedorPorCategoria
} = require('../controllers/proveedorController');

router.post('/', crearProveedor);
router.get('/', obtenerProveedores);
router.get('/categoria/:categoria', obtenerProveedorPorCategoria); // ← va ANTES de /:id
router.get('/:id', obtenerProveedorPorId);
router.put('/:id', actualizarProveedor);
router.delete('/:id', eliminarProveedor);

module.exports = router;