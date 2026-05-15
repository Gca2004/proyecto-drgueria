const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ── CREAR usuario ─────────────────────────────────────────────
const crearUsuario = async (req, res) => {
  try {
    const { nombre, correo, clave, rol } = req.body;

    const usuarioExistente = await Usuario.findOne({ where: { correo } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese correo' });
    }

    const claveEncriptada = await bcrypt.hash(clave, 10);

    const usuario = await Usuario.create({
      nombre,
      correo,
      clave: claveEncriptada,
      rol
    });

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ── LEER todos los usuarios ───────────────────────────────────
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['clave'] }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── LEER un usuario por ID ────────────────────────────────────
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['clave'] }
    });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── ACTUALIZAR usuario ────────────────────────────────────────
const actualizarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const { nombre, correo, rol } = req.body;
    await usuario.update({ nombre, correo, rol });
    res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ── ELIMINAR usuario ──────────────────────────────────────────
const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    await usuario.destroy();
    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { correo, clave } = req.body;

    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const claveValida = await bcrypt.compare(clave, usuario.clave);
    if (!claveValida) {
      return res.status(401).json({ error: 'Clave incorrecta' });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────
const logout = async (req, res) => {
  res.json({
    mensaje: 'Sesión cerrada exitosamente',
    instruccion: 'Elimina el token del almacenamiento del navegador'
  });
};

// ── CAMBIAR CLAVE ─────────────────────────────────────────────
const cambiarclave = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { clave_actual, clave_nueva } = req.body;

    const claveValida = await bcrypt.compare(clave_actual, usuario.clave);
    if (!claveValida) {
      return res.status(401).json({ error: 'La clave actual es incorrecta' });
    }

    const claveNuevaEncriptada = await bcrypt.hash(clave_nueva, 10);
    await usuario.update({ clave: claveNuevaEncriptada });

    res.json({ mensaje: 'Clave actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── RESETEAR CLAVE ────────────────────────────────────────────
const resetearclave = async (req, res) => {
  try {
    const { correo, clave_nueva } = req.body;

    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(404).json({ error: 'No existe un usuario con ese correo' });
    }

    const claveNuevaEncriptada = await bcrypt.hash(clave_nueva, 10);
    await usuario.update({ clave: claveNuevaEncriptada });

    res.json({ mensaje: 'Clave reseteada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  login,
  logout,
  cambiarclave,
  resetearclave
};