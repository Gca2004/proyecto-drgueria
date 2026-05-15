const express = require('express');
const router = express.Router();
const {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
  realizarCompra,
  obtenerAlertas,
  recargarStock
} = require('../controllers/productoController');

router.post('/', crearProducto);
router.get('/', obtenerProductos);
router.get('/alertas', obtenerAlertas);
router.get('/:id', obtenerProductoPorId);
router.post('/:id/comprar', realizarCompra);  
router.put('/:id/stock', recargarStock);       
router.put('/:id', actualizarProducto);        

module.exports = router;