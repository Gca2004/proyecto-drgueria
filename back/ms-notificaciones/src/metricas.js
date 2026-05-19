const client = require('prom-client');

const notificacionesPorTipo = new client.Counter({
  name: 'ms_notificaciones_creadas_por_tipo_total',
  help: 'Total de notificaciones creadas agrupadas por tipo',
  labelNames: ['tipo']
});

const erroresNotificaciones = new client.Counter({
  name: 'ms_notificaciones_errores_total',
  help: 'Total de errores al crear notificaciones',
  labelNames: ['tipo']
});

const notificacionesLeidas = new client.Gauge({
  name: 'ms_notificaciones_leidas',
  help: 'Notificaciones marcadas como leídas'
});

const notificacionesNoLeidas = new client.Gauge({
  name: 'ms_notificaciones_no_leidas',
  help: 'Notificaciones sin leer acumuladas'
});

module.exports = {
  notificacionesPorTipo,
  erroresNotificaciones,
  notificacionesLeidas,
  notificacionesNoLeidas
};