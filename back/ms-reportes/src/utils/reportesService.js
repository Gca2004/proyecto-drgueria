const fs   = require('fs');
const axios = require('axios');
const {
  ensureDirectories,
  snapshotPath,
  datasetPath,
  resultadosPath,
  outputDir,
  pythonGeneratorPath,
  pythonAnalysisPath
} = require('./paths');
const { runPythonScript } = require('./pythonRunner');

const scanMaxPagos = parseInt(process.env.PAGOS_SCAN_MAX_ID || '200', 10);

// ── Cliente HTTP con timeout generoso ──────────────────────
const api = axios.create({ timeout: 8000 });

// ── Helper: GET que nunca lanza excepción ──────────────────
const safeGet = async (url, fallback = []) => {
  try {
    const res = await api.get(url);
    return res.data ?? fallback;
  } catch {
    return fallback;
  }
};

const persistJson = (filePath, data) =>
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

const parseDetalleAuditoria = (detalle) => {
  if (!detalle) return {};
  if (typeof detalle === 'object') return detalle;
  try { return JSON.parse(detalle); } catch { return { texto: String(detalle) }; }
};

const extraerComprasDesdeAuditoria = (logs = []) =>
  logs
    .filter(log => String(log.accion || '').toLowerCase() === 'compra_realizada')
    .map(log => {
      const d = parseDetalleAuditoria(log.detalle);
      return {
        id:              log.id,
        usuario_id:      log.usuario_id,
        producto_id:     d.producto_id     || null,
        producto_nombre: d.producto_nombre || '',
        categoria:       d.categoria       || '',
        cantidad:        Number(d.cantidad        || 0),
        precio_unitario: Number(d.precio_unitario || 0),
        monto_total:     Number(d.monto_total     || 0),
        stock_restante:  Number(d.stock_restante  || 0),
        fecha:           log.fecha || null
      };
    });

// ── Obtener pagos escaneando IDs (tolerante a 404) ─────────
const obtenerPagos = async () => {
  const peticiones = [];
  for (let id = 1; id <= scanMaxPagos; id++) {
    peticiones.push(
      api.get(`${process.env.MS_PAGOS_URL}/${id}`)
         .then(r => r.data)
         .catch(() => null)
    );
  }
  const resultados = await Promise.all(peticiones);
  return resultados.filter(item => item && item.id);
};

// ── Obtener auditoría tolerando cualquier error ────────────
const obtenerAuditoria = async () => {
  if (!process.env.MS_AUDITORIA_URL) return [];
  try {
    const base = process.env.MS_AUDITORIA_URL.replace(/\/$/, '');
    const url  = base.endsWith('/auditoria') ? `${base}/logs` : `${base}/auditoria/logs`;
    const res  = await api.get(url);
    return Array.isArray(res.data) ? res.data : [];
  } catch { return []; }
};

// ── Obtener compras tolerando cualquier error ──────────────
const obtenerCompras = async () => {
  if (!process.env.MS_COMPRAS_URL) return [];
  try {
    const base = process.env.MS_COMPRAS_URL.replace(/\/$/, '');
    const url  = base.endsWith('/compras') ? base : `${base}/compras`;
    const res  = await api.get(url);
    return Array.isArray(res.data) ? res.data : [];
  } catch { return []; }
};

// ── Recolectar datos de todos los MS en paralelo ───────────
const obtenerDatosEnVivo = async () => {
  const [
    usuarios,
    productos,
    proveedores,
    pedidos,
    alertasRaw,
    compras,
    pagos,
    auditoria
  ] = await Promise.all([
    safeGet(process.env.MS_USUARIOS_URL,    []),
    safeGet(process.env.MS_PRODUCTOS_URL,   []),
    safeGet(process.env.MS_PROVEEDORES_URL, []),
    safeGet(process.env.MS_PEDIDOS_URL,     []),
    safeGet(`${process.env.MS_PRODUCTOS_URL}/alertas`, {}),
    obtenerCompras(),
    obtenerPagos(),
    obtenerAuditoria()
  ]);

  return {
    generado_en: new Date().toISOString(),
    usuarios:    Array.isArray(usuarios)    ? usuarios    : [],
    productos:   Array.isArray(productos)   ? productos   : [],
    proveedores: Array.isArray(proveedores) ? proveedores : [],
    pedidos:     Array.isArray(pedidos)     ? pedidos     : [],
    alertas:     alertasRaw,
    compras,
    pagos,
    auditoria
  };
};

// ── Resumen en tiempo real ─────────────────────────────────
const obtenerResumenTiempoReal = async () => {
  const datos = await obtenerDatosEnVivo();

  const productos  = datos.productos;
  const pedidos    = datos.pedidos;
  const compras    = datos.compras;
  const pagos      = datos.pagos;
  const usuarios   = datos.usuarios;
  const alertas    = Array.isArray(datos.alertas?.productos_con_stock_bajo)
                       ? datos.alertas.productos_con_stock_bajo : [];

  const comprasAuditoria = extraerComprasDesdeAuditoria(datos.auditoria);

  const ingresosCompras   = compras.filter(c => c.estado === 'pagado')
                                   .reduce((s, c) => s + parseFloat(c.total  || 0), 0);
  const ingresosPageos    = pagos.filter(p => p.estado === 'aprobado')
                                  .reduce((s, p) => s + parseFloat(p.monto  || 0), 0);
  const ingresosAuditoria = comprasAuditoria.reduce((s, c) => s + Number(c.monto_total || 0), 0);

  const totalCompras    = compras.length || pagos.length || comprasAuditoria.length;
  const ingresosTotales = compras.length ? ingresosCompras
                         : pagos.length  ? ingresosPageos
                         : ingresosAuditoria;

  const stockTotal        = productos.reduce((s, p) => s + Number(p.stock_actual || 0), 0);
  const clientes          = usuarios.filter(u => u.rol === 'cliente').length;
  const administradores   = usuarios.filter(u => u.rol === 'administrador').length;
  const pedidosEntregados = pedidos.filter(p => p.estado_pedido === 'entregado').length;

  return {
    generado_en:          datos.generado_en,
    total_usuarios:       usuarios.length,
    total_clientes:       clientes,
    total_administradores: administradores,
    total_productos:      productos.length,
    stock_total:          stockTotal,
    productos_stock_bajo: alertas.length,
    total_proveedores:    datos.proveedores.length,
    total_pedidos:        pedidos.length,
    pedidos_entregados:   pedidosEntregados,
    total_pagos_detectados: totalCompras,
    ingresos_aprobados:   Number(ingresosTotales.toFixed(2)),
    total_logs_auditoria: datos.auditoria.length
  };
};

// ── Construir dataset CSV ──────────────────────────────────
const construirDatasetActualizado = async () => {
  ensureDirectories();
  const snapshot = await obtenerDatosEnVivo();
  persistJson(snapshotPath, snapshot);

  const ejecucion = await runPythonScript(pythonGeneratorPath, [snapshotPath, datasetPath]);
  const lineas    = fs.readFileSync(datasetPath, 'utf8').trim().split(/\r?\n/);

  return {
    snapshot_path:    snapshotPath,
    dataset_csv_path: datasetPath,
    total_registros:  Math.max(lineas.length - 1, 0),
    salida_python:    ejecucion.stdout
  };
};

// ── Ejecutar análisis Python/Spark ─────────────────────────
const ejecutarAnalisisPython = async (datasetCsvPath) => {
  ensureDirectories();

  const ejecucion = await runPythonScript(
    pythonAnalysisPath,
    [datasetCsvPath, outputDir, resultadosPath]
  );

  const archivos = fs.readdirSync(outputDir)
    .filter(n => n.endsWith('.png') || n.endsWith('.pdf'));

  return {
    resultados_path:    resultadosPath,
    output_dir:         outputDir,
    archivos_generados: archivos,
    salida_python:      ejecucion.stdout
  };
};

module.exports = {
  construirDatasetActualizado,
  obtenerResumenTiempoReal,
  ejecutarAnalisisPython
};
