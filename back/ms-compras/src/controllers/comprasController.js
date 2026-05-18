const axios = require('axios');
const Compra = require('../models/Compra');

const crearCompra = async (req, res) => {
  try {
    const { usuario_id, items, metodo_pago } = req.body;

    if (!usuario_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Faltan datos: usuario_id e items son obligatorios' });
    }

    const itemsDetalle = [];
    let total = 0;

    // Descontar stock via MS Productos (con Axios, no con modelos directos)
    for (const item of items) {
      const { producto_id, cantidad, nombre, precio } = item;

      try {
        await axios.post(
          `${process.env.MS_PRODUCTOS_URL}/productos/${producto_id}/comprar`,
          { cantidad }
        );
      } catch (err) {
        return res.status(400).json({
          error: `No se pudo descontar stock del producto ${producto_id}`,
          detalle: err.response?.data?.error || err.message
        });
      }

      const subtotal = Number(precio) * Number(cantidad);
      total += subtotal;

      itemsDetalle.push({
        producto_id,
        nombre:          nombre || `Producto #${producto_id}`,
        cantidad:        Number(cantidad),
        precio_unitario: Number(precio),
        subtotal:        Number(subtotal.toFixed(2))
      });
    }

    // Guardar compra
    const numero_factura = `FAC-${Date.now()}-${usuario_id}`;
    const compra = await Compra.create({
      usuario_id,
      items:         JSON.stringify(itemsDetalle),
      total:         Number(total.toFixed(2)),
      metodo_pago:   metodo_pago || 'efectivo',
      estado:        'pagado',
      numero_factura
    });

    // Llamar a MS Pagos (no crítico, no rompe si falla)
    try {
      await axios.post(`${process.env.MS_PAGOS_URL}/pagos`, {
        compra_id:   compra.id_compra,
        usuario_id,
        monto:       total,
        metodo_pago: metodo_pago || 'efectivo'
      });
    } catch (err) {
      console.warn('MS Pagos no disponible:', err.message);
    }

    // Vaciar carrito (no crítico)
    try {
      await axios.delete(
        `${process.env.MS_PRODUCTOS_URL}/productos/carrito/vaciar/${usuario_id}`
      );
    } catch (err) {
      console.warn('No se pudo vaciar el carrito:', err.message);
    }

    res.status(201).json({
      mensaje: '¡Compra realizada exitosamente!',
      compra: {
        id_compra:      compra.id_compra,
        usuario_id,
        items:          itemsDetalle,
        total:          Number(total.toFixed(2)),
        metodo_pago:    metodo_pago || 'efectivo',
        estado:         'pagado',
        numero_factura,
        fecha:          compra.createdAt
      }
    });

  } catch (error) {
    console.error('Error en checkout:', error.message);
    res.status(500).json({ error: 'Error procesando la compra', detalle: error.message });
  }
};

const obtenerCompras = async (req, res) => {
  try {
    const compras = await Compra.findAll({ order: [['id_compra', 'DESC']] });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerCompraPorId = async (req, res) => {
  try {
    const compra = await Compra.findByPk(req.params.id);
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });
    res.json(compra);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const obtenerHistorialUsuario = async (req, res) => {
  try {
    const compras = await Compra.findAll({
      where: { usuario_id: req.params.usuario_id },
      order: [['id_compra', 'DESC']]
    });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const { Op } = require('sequelize');

const resumenHoy = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const compras = await Compra.findAll({
      where: {
        createdAt: { [Op.gte]: hoy },
        estado: 'pagado'
      }
    });

    const ingresos = compras.reduce((s, c) => s + Number(c.total), 0);

    res.json({
      total_compras: compras.length,
      ingresos_hoy: ingresos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = { crearCompra, obtenerCompras, obtenerCompraPorId,obtenerHistorialUsuario, resumenHoy };