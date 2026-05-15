const Proveedor = require('../models/Proveedor');

const crearProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.create(req.body);
    res.status(201).json({ mensaje: 'Proveedor creado exitosamente', proveedor });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const obtenerProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll();
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerProveedorPorId = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    await proveedor.update(req.body);
    res.json({ mensaje: 'Proveedor actualizado', proveedor });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const eliminarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    await proveedor.destroy();
    res.json({ mensaje: 'Proveedor eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Buscar proveedor por categoría (la usa MS Productos con Axios)
const obtenerProveedorPorCategoria = async (req, res) => {
  try {
    const proveedor = await Proveedor.findOne({
      where: { categoria: req.params.categoria }
    });
    if (!proveedor) {
      return res.status(404).json({ error: 'No hay proveedor para esa categoría' });
    }
    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearProveedor,
  obtenerProveedores,
  obtenerProveedorPorId,
  actualizarProveedor,
  eliminarProveedor,
  obtenerProveedorPorCategoria
};