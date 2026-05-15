const Pedido = require('../models/Pedido');
const Proveedor = require('../models/Proveedor');
const axios = require('axios');

const crearPedido = async (req, res) => {
  try {
    const pedido = await Pedido.create(req.body);
    res.status(201).json({ mensaje: 'Pedido creado exitosamente', pedido });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      include: [{
        model: Proveedor,
        attributes: ['nombre', 'contacto', 'telefono', 'categoria']
      }]
    });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerPedidoPorId = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [{ model: Proveedor }]
    });
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ACTUALIZAR estado del pedido
// Si el estado cambia a "entregado", recarga el stock en MS Productos con Axios
const actualizarPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const estadoAnterior = pedido.estado_pedido;
    await pedido.update(req.body);

    // Si el pedido acaba de cambiar a "entregado"
    if (req.body.estado_pedido === 'entregado' && estadoAnterior !== 'entregado') {

      try {
        // Le avisamos a MS Productos para que recargue el stock
        await axios.put(
          `${process.env.MS_PRODUCTOS_URL}/productos/${pedido.id_producto}/stock`,
          { cantidad: pedido.cantidad_solicitada }
        );

        console.log(`Stock recargado: ${pedido.cantidad_solicitada} unidades al producto ${pedido.id_producto}`);

      } catch (err) {
        console.error('Error recargando stock en MS Productos:', err.message);
      }
    }

    res.json({ 
      mensaje: 'Pedido actualizado', 
      pedido,
      stock_recargado: req.body.estado_pedido === 'entregado' && estadoAnterior !== 'entregado'
        ? `Se recargaron ${pedido.cantidad_solicitada} unidades al producto ${pedido.id_producto}`
        : null
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const eliminarPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    await pedido.destroy();
    res.json({ mensaje: 'Pedido eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarPedido,
  eliminarPedido
};