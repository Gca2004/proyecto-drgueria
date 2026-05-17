const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', '..');
const dataDir = path.join(rootDir, 'data');
const outputDir = path.join(rootDir, 'output');
const snapshotPath = path.join(dataDir, 'snapshot.json');
const datasetPath = path.join(dataDir, 'dataset_drgueria.csv');
const resultadosPath = path.join(rootDir, 'resultados_spark.txt');
const pythonGeneratorPath = path.join(rootDir, 'generar_dataset.py');
const pythonAnalysisPath = path.join(rootDir, 'analisis_drgueria.py');

const ensureDirectories = () => {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
};

module.exports = {
  rootDir,
  dataDir,
  outputDir,
  snapshotPath,
  datasetPath,
  resultadosPath,
  pythonGeneratorPath,
  pythonAnalysisPath,
  ensureDirectories
};
