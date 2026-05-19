const Notificacion = require('../models/Notificacion');
const { Op } = require('sequelize');
const { 
  notificacionesPorTipo, 
  erroresNotificaciones,
  notificacionesLeidas,
  notificacionesNoLeidas
} = require('../metricas');

// CREAR - Stock bajo
const crearStockBajo = async (req, res) => {
  try {
    const { producto_id, producto_nombre, stock_actual } = req.body;
    const notificacion = await Notificacion.create({
      tipo: 'stock_bajo',
      mensaje: `⚠️ ${producto_nombre} tiene stock crítico: ${stock_actual} unidades`,
      estado: 'enviada',
      referencia_id: producto_id,
      referencia_tipo: 'producto'
    });
    notificacionesPorTipo.inc({ tipo: 'stock_bajo' });
    notificacionesNoLeidas.inc();
    res.status(201).json({ mensaje: 'Notificación de stock bajo registrada', notificacion });
  } catch (error) {
    erroresNotificaciones.inc({ tipo: 'stock_bajo' });
    res.status(500).json({ error: error.message });
  }
};

// CREAR - Compra
const crearCompra = async (req, res) => {
  try {
    const { usuario_id, compra_id, total } = req.body;
    const notificacion = await Notificacion.create({
      usuario_id,
      tipo: 'compra_confirmada',
      mensaje: `🛒 Tu compra fue exitosa. Factura: FAC-${compra_id}. Total: $${total}`,
      estado: 'enviada',
      referencia_id: compra_id,
      referencia_tipo: 'compra'
    });
    notificacionesPorTipo.inc({ tipo: 'compra_confirmada' });
    notificacionesNoLeidas.inc();
    res.status(201).json({ mensaje: 'Notificación de compra registrada', notificacion });
  } catch (error) {
    erroresNotificaciones.inc({ tipo: 'compra_confirmada' });
    res.status(500).json({ error: error.message });
  }
};

// CREAR - Pago
const crearPago = async (req, res) => {
  try {
    const { usuario_id, estado, numero_factura } = req.body;
    const mensaje = estado === 'aprobado'
      ? `✅ Tu pago ${numero_factura} fue aprobado exitosamente`
      : `❌ Tu pago fue rechazado. Por favor intenta con otro método de pago.`;
    const notificacion = await Notificacion.create({
      usuario_id,
      tipo: `pago_${estado}`,
      mensaje,
      estado: 'enviada',
      referencia_id: null,
      referencia_tipo: 'pago'
    });
    notificacionesPorTipo.inc({ tipo: `pago_${estado}` });
    notificacionesNoLeidas.inc();
    res.status(201).json({ mensaje: 'Notificación de pago registrada', notificacion });
  } catch (error) {
    erroresNotificaciones.inc({ tipo: 'pago' });
    res.status(500).json({ error: error.message });
  }
};

// CREAR - Pedido
const crearPedido = async (req, res) => {
  try {
    const { admin_id, pedido_id, estado } = req.body;
    const notificacion = await Notificacion.create({
      usuario_id: admin_id,
      tipo: `pedido_${estado}`,
      mensaje: `📦 El pedido #${pedido_id} cambió a estado: ${estado}`,
      estado: 'enviada',
      referencia_id: pedido_id,
      referencia_tipo: 'pedido'
    });
    notificacionesPorTipo.inc({ tipo: `pedido_${estado}` });
    notificacionesNoLeidas.inc();
    res.status(201).json({ mensaje: 'Notificación de pedido registrada', notificacion });
  } catch (error) {
    erroresNotificaciones.inc({ tipo: 'pedido' });
    res.status(500).json({ error: error.message });
  }
};

// LEER - Todas las notificaciones con filtros
const obtenerTodas = async (req, res) => {
  try {
    const where = {};
    if (req.query.tipo) where.tipo = { [Op.like]: `%${req.query.tipo}%` };
    if (req.query.usuario_id) where.usuario_id = req.query.usuario_id;
    if (req.query.desde && req.query.hasta) {
      where.fecha = { [Op.between]: [req.query.desde, req.query.hasta] };
    }
    const notificaciones = await Notificacion.findAll({
      where,
      order: [['fecha', 'DESC']]
    });
    res.json(notificaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LEER - Una notificación por ID
const obtenerPorId = async (req, res) => {
  try {
    const notificacion = await Notificacion.findByPk(req.params.id);
    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    res.json(notificacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LEER - Por usuario
const obtenerPorUsuario = async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      where: { usuario_id: req.params.id },
      order: [['fecha', 'DESC']]
    });
    const leidas = notificaciones.filter(n => n.leida).length;
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    notificacionesLeidas.set(leidas);
    notificacionesNoLeidas.set(noLeidas);
    res.json(notificaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ACTUALIZAR - Marcar como leída
const marcarLeida = async (req, res) => {
  try {
    const notificacion = await Notificacion.findByPk(req.params.id);
    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    await notificacion.update({ leida: true });
    notificacionesLeidas.inc();
    res.json({ mensaje: 'Notificación marcada como leída', notificacion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  crearStockBajo, 
  crearCompra, 
  crearPago, 
  crearPedido,
  obtenerTodas,
  obtenerPorId,
  obtenerPorUsuario,
  marcarLeida
};