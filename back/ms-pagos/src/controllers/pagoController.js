const Transaccion = require('../models/Transaccion');
const axios = require('axios');

const crearPago = async (req, res) => {
  try {
    const { compra_id, usuario_id, monto, metodo_pago } = req.body;
    if (!compra_id || !usuario_id || !monto) {
      return res.status(400).json({ error: 'Faltan datos: compra_id, usuario_id, monto' });
    }

    const numero_factura = `FAC-${Date.now()}-${usuario_id}-${compra_id}`;

    const transaccion = await Transaccion.create({
      compra_id, usuario_id, monto,
      metodo_pago: metodo_pago || 'efectivo',
      numero_factura, estado: 'aprobado'
    });

    // Notificar (no bloquea la respuesta si falla)
    axios.post(`${process.env.MS_NOTIFICACIONES_URL}/notificaciones/pago`, {
      usuario_id, estado: 'aprobado', numero_factura
    }).catch(err => console.warn('No se pudo notificar pago:', err.message));

    res.status(201).json({
      mensaje: 'Pago procesado exitosamente',
      transaccion: {
        id: transaccion.id,
        numero_factura: transaccion.numero_factura,
        monto: transaccion.monto,
        estado: transaccion.estado,
        fecha: transaccion.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerPago = async (req, res) => {
  try {
    const t = await Transaccion.findByPk(req.params.id);
    if (!t) return res.status(404).json({ error: 'Transacción no encontrada' });
    res.json(t);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const pagosPorCompra = async (req, res) => {
  try {
    const t = await Transaccion.findOne({ where: { compra_id: req.params.compra_id } });
    if (!t) return res.status(404).json({ error: 'No hay pago para esa compra' });
    res.json(t);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const pagosPorUsuario = async (req, res) => {
  try {
    const lista = await Transaccion.findAll({ where: { usuario_id: req.params.usuario_id } });
    res.json(lista);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const pagosPorFactura = async (req, res) => {
  try {
    const t = await Transaccion.findOne({ where: { numero_factura: req.params.numero_factura } });
    if (!t) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json(t);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const actualizarEstado = async (req, res) => {
  try {
    const t = await Transaccion.findByPk(req.params.id);
    if (!t) return res.status(404).json({ error: 'Transacción no encontrada' });
    await t.update({ estado: req.body.estado });
    res.json({ mensaje: 'Estado actualizado', transaccion: t });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { crearPago, obtenerPago, pagosPorCompra, pagosPorUsuario, pagosPorFactura, actualizarEstado };