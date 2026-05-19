const express = require('express');
const router = express.Router();
const {
  registrarLog,
  obtenerLogs,
  obtenerResumen,
  obtenerActividadPorServicio,
  exportarLogs
} = require('../controllers/auditoriaController');

router.post('/log', registrarLog);
router.get('/resumen', obtenerResumen);
router.get('/actividad', obtenerActividadPorServicio);
router.get('/logs/exportar', exportarLogs);
router.get('/logs', obtenerLogs);

module.exports = router;
