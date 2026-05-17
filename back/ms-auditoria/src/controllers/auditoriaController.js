const Log = require('../models/Log');

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
  exportarLogs
};
