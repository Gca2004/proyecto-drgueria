const fs = require('fs');
const path = require('path');
const {
  construirDatasetActualizado,
  obtenerResumenTiempoReal,
  ejecutarAnalisisPython
} = require('../utils/reportesService');

const obtenerEstado = async (req, res) => {
  try {
    const resumen = await obtenerResumenTiempoReal();
    res.json({
      mensaje: 'Estado analitico obtenido exitosamente',
      servicio: 'ms-reportes',
      resumen
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerTiempoReal = async (req, res) => {
  try {
    const resumen = await obtenerResumenTiempoReal();
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const descargarDatasetActualizado = async (req, res) => {
  try {
    const resultado = await construirDatasetActualizado();
    res.json({
      mensaje: 'Dataset actualizado exitosamente',
      dataset: resultado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const ejecutarAnalisis = async (req, res) => {
  try {
    const dataset = await construirDatasetActualizado();
    const analisis = await ejecutarAnalisisPython(dataset.dataset_csv_path);

    res.json({
      mensaje: 'Analisis ejecutado exitosamente',
      dataset,
      analisis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerResultados = async (req, res) => {
  try {
    const resultadosPath = path.join(__dirname, '..', '..', 'resultados_spark.txt');
    const contenido = fs.readFileSync(resultadosPath, 'utf8');

    res.json({
      mensaje: 'Resultados obtenidos exitosamente',
      archivo: 'resultados_spark.txt',
      contenido
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerGraficas = async (req, res) => {
  try {
    const outputDir = path.join(__dirname, '..', '..', 'output');
    const archivos = fs.existsSync(outputDir)
      ? fs.readdirSync(outputDir)
          .filter(nombre => nombre.endsWith('.png') || nombre.endsWith('.pdf'))
          .map(nombre => ({
            archivo: nombre,
            url: `/reportes/archivos/${nombre}`
          }))
      : [];

    res.json({
      mensaje: 'Graficas obtenidas exitosamente',
      total: archivos.length,
      archivos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerEstado,
  obtenerTiempoReal,
  descargarDatasetActualizado,
  ejecutarAnalisis,
  obtenerResultados,
  obtenerGraficas
};
