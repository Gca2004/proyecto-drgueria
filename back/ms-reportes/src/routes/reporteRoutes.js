const express = require('express');
const router = express.Router();
const {
  obtenerEstado,
  obtenerTiempoReal,
  descargarDatasetActualizado,
  ejecutarAnalisis,
  obtenerResultados,
  obtenerGraficas
} = require('../controllers/reporteController');

router.get('/estado', obtenerEstado);
router.get('/tiempo-real', obtenerTiempoReal);
router.post('/dataset/actualizar', descargarDatasetActualizado);
router.post('/ejecutar-spark', ejecutarAnalisis);
router.get('/resultados', obtenerResultados);
router.get('/graficas', obtenerGraficas);

module.exports = router;
