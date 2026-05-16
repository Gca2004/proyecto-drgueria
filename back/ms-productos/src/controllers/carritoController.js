const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');

// POST /productos/carrito — agregar al carrito
const agregarAlCarrito = async (req, res) => {
  try {
    const { usuario_id, producto_id, cantidad } = req.body;

    const producto = await Producto.findByPk(producto_id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    if (producto.stock_actual < cantidad) return res.status(400).json({ error: 'Stock insuficiente' });

    const [item, creado] = await Carrito.findOrCreate({
      where: { usuario_id, producto_id },
      defaults: { cantidad }
    });

    if (!creado) {
      item.cantidad += cantidad;
      await item.save();
    }

    res.status(201).json({ mensaje: 'Producto agregado al carrito', item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /productos/carrito/:usuario_id — ver carrito
const verCarrito = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const items = await Carrito.findAll({
      where: { usuario_id },
      include: [{ model: Producto, attributes: ['nombre_producto', 'precio', 'stock_actual'] }]
    });

    const carrito = items.map(item => ({
      carrito_id: item.id,
      producto_id: item.producto_id,
      nombre: item.Producto.nombre_producto,
      precio: item.Producto.precio,
      cantidad: item.cantidad,
      subtotal: item.Producto.precio * item.cantidad,
      stock_disponible: item.Producto.stock_actual
    }));

    const total = carrito.reduce((sum, i) => sum + i.subtotal, 0);
    res.json({ items: carrito, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /productos/carrito/:id — modificar cantidad
const modificarCantidad = async (req, res) => {
  try {
    const item = await Carrito.findByPk(req.params.id, {
      include: [Producto]
    });
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });

    const { cantidad } = req.body;
    if (item.Producto.stock_actual < cantidad) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    item.cantidad = cantidad;
    await item.save();
    res.json({ mensaje: 'Cantidad actualizada', item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /productos/carrito/:id — eliminar item
const eliminarDelCarrito = async (req, res) => {
  try {
    const item = await Carrito.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });
    await item.destroy();
    res.json({ mensaje: 'Item eliminado del carrito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /productos/carrito/vaciar/:usuario_id — vaciar carrito completo
const vaciarCarrito = async (req, res) => {
  try {
    await Carrito.destroy({ where: { usuario_id: req.params.usuario_id } });
    res.json({ mensaje: 'Carrito vaciado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  agregarAlCarrito,
  verCarrito,
  modificarCantidad,
  eliminarDelCarrito,
  vaciarCarrito
};