const Log = require('../models/Log');
const { fn, col } = require('sequelize');

const registrarLog = async (req, res) => {
  try {
    const log = await Log.create(req.body);
    res.status(201).json({ mensaje: 'Log registrado exitosamente', log });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const obtenerLogs = async (req, res) => {
  try {
    const logs = await Log.findAll({
      order: [['fecha', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerResumen = async (req, res) => {
  try {
    const [total, servicios, usuarios, recientes] = await Promise.all([
      Log.count(),
      Log.count({ distinct: true, col: 'servicio' }),
      Log.count({ distinct: true, col: 'usuario_id' }),
      Log.findAll({
        order: [['fecha', 'DESC']],
        limit: 10
      })
    ]);

    res.json({
      total_eventos: total,
      microservicios_activos: servicios,
      usuarios_involucrados: usuarios,
      logs_recientes: recientes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerActividadPorServicio = async (req, res) => {
  try {
    const actividad = await Log.findAll({
      attributes: [
        'servicio',
        [fn('COUNT', col('id')), 'total_eventos']
      ],
      group: ['servicio'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      raw: true
    });

    res.json(actividad.map(item => ({
      servicio: item.servicio,
      total_eventos: Number(item.total_eventos || 0)
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportarLogs = async (req, res) => {
  try {
    const logs = await Log.findAll({
      order: [['fecha', 'DESC']]
    });

    res.json({
      mensaje: 'Logs exportados exitosamente',
      total: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registrarLog,
  obtenerLogs,
  obtenerResumen,
  obtenerActividadPorServicio,
  exportarLogs
};
