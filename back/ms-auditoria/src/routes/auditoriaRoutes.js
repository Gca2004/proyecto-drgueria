const express = require('express');
const router = express.Router();
const {
  registrarLog,
  obtenerLogs,
  exportarLogs
} = require('../controllers/auditoriaController');

router.post('/log', registrarLog);
router.get('/logs/exportar', exportarLogs);
router.get('/logs', obtenerLogs);

module.exports = router;
