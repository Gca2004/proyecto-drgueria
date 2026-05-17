require('dotenv').config();

const sequelize = require('./src/config/db');
const Log = require('./src/models/Log');

const servicios = ['ms-compras', 'ms-pagos', 'ms-productos', 'ms-proveedores', 'ms-auditoria'];
const acciones = {
  'ms-compras': [
    'compra_creada',
    'compra_confirmada',
    'compra_cancelada',
    'checkout_iniciado'
  ],
  'ms-pagos': [
    'pago_aprobado',
    'pago_rechazado',
    'factura_generada',
    'estado_pago_actualizado'
  ],
  'ms-productos': [
    'stock_consultado',
    'stock_recargado',
    'stock_bajo_detectado',
    'producto_actualizado'
  ],
  'ms-proveedores': [
    'pedido_creado',
    'pedido_entregado',
    'proveedor_consultado',
    'pedido_actualizado'
  ],
  'ms-auditoria': [
    'log_registrado',
    'logs_exportados',
    'consulta_logs',
    'seed_generado'
  ]
};

const detalles = {
  compra_creada: [
    'Compra creada desde carrito web',
    'Compra registrada para procesamiento',
    'Nueva compra pendiente de confirmacion'
  ],
  compra_confirmada: [
    'Compra confirmada por el sistema',
    'Orden validada y enviada a pagos',
    'Compra finalizada correctamente'
  ],
  compra_cancelada: [
    'Compra cancelada por el usuario',
    'Compra cancelada por falta de stock',
    'Compra anulada durante validacion'
  ],
  checkout_iniciado: [
    'Cliente inicio flujo de checkout',
    'Checkout abierto desde catalogo',
    'Proceso de compra iniciado'
  ],
  pago_aprobado: [
    'Pago aprobado por pasarela interna',
    'Transaccion aprobada y factura emitida',
    'Pago confirmado para la compra'
  ],
  pago_rechazado: [
    'Pago rechazado por validacion de monto',
    'Transaccion rechazada por medio de pago',
    'Pago no autorizado'
  ],
  factura_generada: [
    'Factura generada y asociada al pago',
    'Numero de factura emitido correctamente',
    'Factura creada para la transaccion'
  ],
  estado_pago_actualizado: [
    'Estado de pago actualizado manualmente',
    'Transaccion movida a estado pendiente',
    'Estado financiero sincronizado'
  ],
  stock_consultado: [
    'Consulta de stock para producto del catalogo',
    'Inventario verificado antes de compra',
    'Stock revisado desde proceso interno'
  ],
  stock_recargado: [
    'Stock recargado tras entrega de proveedor',
    'Inventario actualizado por ingreso de mercancia',
    'Recarga de stock aplicada correctamente'
  ],
  stock_bajo_detectado: [
    'Se detecto stock bajo y se genero alerta',
    'Inventario por debajo del minimo configurado',
    'Stock critico detectado en producto'
  ],
  producto_actualizado: [
    'Producto actualizado desde modulo administrativo',
    'Precio y categoria ajustados en inventario',
    'Informacion del producto sincronizada'
  ],
  pedido_creado: [
    'Pedido automatico creado para proveedor',
    'Solicitud de abastecimiento registrada',
    'Nuevo pedido emitido por stock bajo'
  ],
  pedido_entregado: [
    'Pedido marcado como entregado',
    'Proveedor confirmo entrega del pedido',
    'Abastecimiento recibido en bodega'
  ],
  proveedor_consultado: [
    'Proveedor consultado por categoria',
    'Busqueda de proveedor realizada por sistema',
    'Consulta de proveedor para abastecimiento'
  ],
  pedido_actualizado: [
    'Estado de pedido actualizado',
    'Pedido ajustado por operador',
    'Pedido modificado desde panel administrativo'
  ],
  log_registrado: [
    'Evento de auditoria registrado correctamente',
    'Nuevo log persistido en la base de datos',
    'Entrada de auditoria almacenada'
  ],
  logs_exportados: [
    'Exportacion de logs solicitada',
    'Reporte de auditoria generado',
    'Consulta de exportacion completada'
  ],
  consulta_logs: [
    'Listado de logs consultado',
    'Consulta general de auditoria ejecutada',
    'Revision de actividad solicitada'
  ],
  seed_generado: [
    'Seed de auditoria ejecutado con datos de prueba',
    'Carga masiva de logs completada',
    'Registros de auditoria generados automaticamente'
  ]
};

const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];

const generarFecha = () => {
  const ahora = Date.now();
  const diasAtras = 45;
  const rango = diasAtras * 24 * 60 * 60 * 1000;
  return new Date(ahora - Math.floor(Math.random() * rango));
};

const generarLogs = (cantidad) => {
  const logs = [];

  for (let i = 0; i < cantidad; i++) {
    const servicio = elegir(servicios);
    const accion = elegir(acciones[servicio]);

    logs.push({
      servicio,
      accion,
      usuario_id: Math.floor(Math.random() * 25) + 1,
      detalle: elegir(detalles[accion]),
      fecha: generarFecha()
    });
  }

  return logs;
};

const sembrarLogs = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conectado a MySQL - drgueria_auditoria');

    await sequelize.sync();

    const cantidad = Math.floor(Math.random() * 101) + 200;
    const logs = generarLogs(cantidad);

    await Log.bulkCreate(logs);

    console.log(`Seed completado: ${cantidad} logs de auditoria generados.`);
    process.exit(0);
  } catch (error) {
    console.error('Error al generar logs de auditoria:', error);
    process.exit(1);
  }
};

sembrarLogs();
