const fs = require('fs');
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

const api = axios.create({
  timeout: 10000
});

const persistJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const parseDetalleAuditoria = (detalle) => {
  if (!detalle) return {};
  if (typeof detalle === 'object') return detalle;

  try {
    return JSON.parse(detalle);
  } catch (error) {
    return { texto: String(detalle) };
  }
};

const extraerComprasDesdeAuditoria = (logs = []) => {
  return logs
    .filter(log => String(log.accion || '').toLowerCase() === 'compra_realizada')
    .map(log => {
      const detalle = parseDetalleAuditoria(log.detalle);
      return {
        id: log.id,
        usuario_id: log.usuario_id,
        producto_id: detalle.producto_id || null,
        producto_nombre: detalle.producto_nombre || '',
        categoria: detalle.categoria || '',
        cantidad: Number(detalle.cantidad || 0),
        precio_unitario: Number(detalle.precio_unitario || 0),
        monto_total: Number(detalle.monto_total || 0),
        stock_restante: Number(detalle.stock_restante || 0),
        fecha: log.fecha || null
      };
    });
};

const obtenerPagos = async () => {
  const peticiones = [];

  for (let id = 1; id <= scanMaxPagos; id++) {
    peticiones.push(
      api.get(`${process.env.MS_PAGOS_URL}/${id}`)
        .then(res => res.data)
        .catch(() => null)
    );
  }

  const resultados = await Promise.all(peticiones);
  return resultados.filter(item => item && item.id);
};

const obtenerAuditoria = async () => {
  if (!process.env.MS_AUDITORIA_URL) {
    return [];
  }

  try {
    const baseUrl = process.env.MS_AUDITORIA_URL.replace(/\/$/, '');
    const url = baseUrl.endsWith('/auditoria') ? `${baseUrl}/logs` : `${baseUrl}/auditoria/logs`;
    const res = await api.get(url);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    return [];
  }
};

const obtenerCompras = async () => {
  if (!process.env.MS_COMPRAS_URL) {
    return [];
  }

  try {
    const baseUrl = process.env.MS_COMPRAS_URL.replace(/\/$/, '');
    const url = baseUrl.endsWith('/compras') ? baseUrl : `${baseUrl}/compras`;
    const res = await api.get(url);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    return [];
  }
};

const obtenerDatosEnVivo = async () => {
  const [
    usuariosRes,
    productosRes,
    proveedoresRes,
    pedidosRes,
    alertasRes,
    compras,
    pagos,
    auditoria
  ] = await Promise.all([
    api.get(process.env.MS_USUARIOS_URL),
    api.get(process.env.MS_PRODUCTOS_URL),
    api.get(process.env.MS_PROVEEDORES_URL),
    api.get(process.env.MS_PEDIDOS_URL),
    api.get(`${process.env.MS_PRODUCTOS_URL}/alertas`),
    obtenerCompras(),
    obtenerPagos(),
    obtenerAuditoria()
  ]);

  return {
    generado_en: new Date().toISOString(),
    usuarios: usuariosRes.data,
    productos: productosRes.data,
    proveedores: proveedoresRes.data,
    pedidos: pedidosRes.data,
    alertas: alertasRes.data,
    compras,
    pagos,
    auditoria
  };
};

const obtenerResumenTiempoReal = async () => {
  const datos = await obtenerDatosEnVivo();

  const productos = Array.isArray(datos.productos) ? datos.productos : [];
  const pedidos = Array.isArray(datos.pedidos) ? datos.pedidos : [];
  const compras = Array.isArray(datos.compras) ? datos.compras : [];
  const pagos = Array.isArray(datos.pagos) ? datos.pagos : [];
  const usuarios = Array.isArray(datos.usuarios) ? datos.usuarios : [];
  const alertas = Array.isArray(datos.alertas?.productos_con_stock_bajo)
    ? datos.alertas.productos_con_stock_bajo
    : [];
  const comprasAuditoria = extraerComprasDesdeAuditoria(Array.isArray(datos.auditoria) ? datos.auditoria : []);

  const ingresosDesdeCompras = compras
    .filter(compra => compra.estado === 'pagado')
    .reduce((suma, compra) => suma + parseFloat(compra.total || 0), 0);
  const ventasAprobadas = pagos
    .filter(pago => pago.estado === 'aprobado')
    .reduce((suma, pago) => suma + parseFloat(pago.monto || 0), 0);
  const ingresosDesdeAuditoria = comprasAuditoria
    .reduce((suma, compra) => suma + Number(compra.monto_total || 0), 0);
  const totalCompras = compras.length || pagos.length || comprasAuditoria.length;
  const ingresosTotales = compras.length ? ingresosDesdeCompras : pagos.length ? ventasAprobadas : ingresosDesdeAuditoria;

  const stockTotal = productos.reduce((suma, producto) => suma + Number(producto.stock_actual || 0), 0);
  const clientes = usuarios.filter(usuario => usuario.rol === 'cliente').length;
  const administradores = usuarios.filter(usuario => usuario.rol === 'administrador').length;
  const pedidosEntregados = pedidos.filter(pedido => pedido.estado_pedido === 'entregado').length;

  return {
    generado_en: datos.generado_en,
    total_usuarios: usuarios.length,
    total_clientes: clientes,
    total_administradores: administradores,
    total_productos: productos.length,
    stock_total: stockTotal,
    productos_stock_bajo: alertas.length,
    total_proveedores: Array.isArray(datos.proveedores) ? datos.proveedores.length : 0,
    total_pedidos: pedidos.length,
    pedidos_entregados: pedidosEntregados,
    total_pagos_detectados: totalCompras,
    ingresos_aprobados: Number(ingresosTotales.toFixed(2)),
    total_logs_auditoria: Array.isArray(datos.auditoria) ? datos.auditoria.length : 0
  };
};

const construirDatasetActualizado = async () => {
  ensureDirectories();

  const snapshot = await obtenerDatosEnVivo();
  persistJson(snapshotPath, snapshot);

  const ejecucion = await runPythonScript(pythonGeneratorPath, [snapshotPath, datasetPath]);

  const lineas = fs.readFileSync(datasetPath, 'utf8').trim().split(/\r?\n/);
  const totalRegistros = Math.max(lineas.length - 1, 0);

  return {
    snapshot_path: snapshotPath,
    dataset_csv_path: datasetPath,
    total_registros: totalRegistros,
    salida_python: ejecucion.stdout
  };
};

const ejecutarAnalisisPython = async (datasetCsvPath) => {
  ensureDirectories();

  const ejecucion = await runPythonScript(
    pythonAnalysisPath,
    [datasetCsvPath, outputDir, resultadosPath]
  );

  const archivos = fs.readdirSync(outputDir)
    .filter(nombre => nombre.endsWith('.png') || nombre.endsWith('.pdf'));

  return {
    resultados_path: resultadosPath,
    output_dir: outputDir,
    archivos_generados: archivos,
    salida_python: ejecucion.stdout
  };
};

module.exports = {
  construirDatasetActualizado,
  obtenerResumenTiempoReal,
  ejecutarAnalisisPython
};
