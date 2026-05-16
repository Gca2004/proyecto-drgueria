const breaker = require('../circuitBreaker');
const Producto = require('../models/Producto');
const axios = require('axios');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// CREAR producto
const crearProducto = async (req, res) => {
  try {
    const producto = await Producto.create(req.body);
    res.status(201).json({ mensaje: 'Producto creado exitosamente', producto });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// LEER todos los productos
const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LEER un producto por ID
const obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ACTUALIZAR producto
const actualizarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await producto.update(req.body);
    res.json({ mensaje: 'Producto actualizado', producto });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ELIMINAR producto
const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await producto.destroy();
    res.json({ mensaje: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// REALIZAR COMPRA con alerta automática y pedido al proveedor correcto
const realizarCompra = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { cantidad } = req.body;

    if (producto.stock_actual < cantidad) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // Descontamos el stock
    producto.stock_actual -= cantidad;
    await producto.save();

    // ✅ Respuesta al cliente SIN ninguna alerta
    res.json({
      mensaje: 'Compra realizada exitosamente',
      producto: producto.nombre_producto,
      cantidad_comprada: cantidad,
      stock_restante: producto.stock_actual
    });

    // ✅ DESPUÉS de responder, verificamos internamente
    setImmediate(async () => {
      if (producto.stock_actual < producto.stock_minimo) {
        const cantidadAPedir = (producto.stock_minimo * 2) - producto.stock_actual;

        try {
          // Buscar proveedor de esa categoría
          const respuestaProveedor = await axios.get(
            `${process.env.MS_PROVEEDORES_URL}/proveedores/categoria/${encodeURIComponent(producto.categoria)}`
          );
          const proveedor = respuestaProveedor.data;

          // Crear pedido automático usando Circuit Breaker
          await breaker.fire({
            id_producto: producto.id_producto,
            id_proveedor: proveedor.id_proveedor,
            cantidad_solicitada: cantidadAPedir
          });

          console.log(`⚠️ Pedido automático generado: ${cantidadAPedir} uds de ${proveedor.nombre}`);
        } catch (err) {
          console.error('Error en proceso interno de stock bajo:', err.message);
        }
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// VER ALERTAS DE STOCK BAJO con cantidad a pedir y pedidos activos
const obtenerAlertas = async (req, res) => {
  try {
    const productosConStockBajo = await Producto.findAll({
      where: {
        stock_actual: { [Op.lt]: sequelize.col('stock_minimo') }
      }
    });

    // Calculamos cuánto hay que pedir por cada producto
    const alertas = productosConStockBajo.map(producto => {
      const cantidadNecesaria = (producto.stock_minimo * 2) - producto.stock_actual;
      return {
        id_producto: producto.id_producto,
        nombre_producto: producto.nombre_producto,
        categoria: producto.categoria,
        stock_actual: producto.stock_actual,
        stock_minimo: producto.stock_minimo,
        cantidad_a_pedir: cantidadNecesaria,
        mensaje: `Quedan ${producto.stock_actual} unidades, se recomienda pedir ${cantidadNecesaria}`
      };
    });

    // Consultamos pedidos activos en MS Proveedores
    let pedidosActivos = [];
    try {
      const respuesta = await axios.get(
        `${process.env.MS_PROVEEDORES_URL}/pedidos`
      );
      pedidosActivos = respuesta.data.filter(
        p => p.estado_pedido !== 'entregado'
      );
    } catch (err) {
      console.error('No se pudo consultar pedidos:', err.message);
    }

    res.json({
      total_productos_con_stock_bajo: alertas.length,
      productos_con_stock_bajo: alertas,
      pedidos_en_curso: pedidosActivos
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Recargar stock cuando llega un pedido (la llama MS Proveedores con Axios)
const recargarStock = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { cantidad } = req.body;

    // Sumamos la cantidad al stock actual
    producto.stock_actual += cantidad;
    await producto.save();

    res.json({
      mensaje: 'Stock recargado exitosamente',
      producto: producto.nombre_producto,
      stock_anterior: producto.stock_actual - cantidad,
      cantidad_recargada: cantidad,
      stock_nuevo: producto.stock_actual
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
  realizarCompra,
  obtenerAlertas,
  recargarStock
};