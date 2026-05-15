const express = require('express');
const router = express.Router();
const {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  login,
  logout,
  cambiarclave,
  resetearclave
} = require('../controllers/usuarioController');

router.post('/login', login);
router.post('/logout', logout);
router.post('/resetear-clave', resetearclave);
router.put('/:id/clave', cambiarclave);
router.post('/', crearUsuario);
router.get('/', obtenerUsuarios);
router.get('/:id', obtenerUsuarioPorId);
router.put('/:id', actualizarUsuario);
router.delete('/:id', eliminarUsuario);

module.exports = router;