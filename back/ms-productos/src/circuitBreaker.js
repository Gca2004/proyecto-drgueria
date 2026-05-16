const CircuitBreaker = require('opossum');
const axios = require('axios');

const llamarProveedores = async (datos) => {
  const response = await axios.post(
    `${process.env.MS_PROVEEDORES_URL}/pedidos`,
    datos,
    { timeout: 3000 }
  );
  return response.data;
};

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5
};

const breaker = new CircuitBreaker(llamarProveedores, options);

breaker.fallback((datos) => {
  console.warn('MS Proveedores no disponible. Pedido en cola local.');
  return {
    success: false,
    mensaje: 'Servicio de proveedores temporalmente no disponible.',
    datos_pendientes: datos
  };
});

breaker.on('open', () => console.error('🔴 Circuit Breaker ABIERTO: MS Proveedores caído'));
breaker.on('halfOpen', () => console.warn('🟡 Circuit Breaker SEMI-ABIERTO: probando MS Proveedores'));
breaker.on('close', () => console.log('🟢 Circuit Breaker CERRADO: MS Proveedores recuperado'));

module.exports = breaker;