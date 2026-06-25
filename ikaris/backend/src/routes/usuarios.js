const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const {
  listarUsuarios, invitar, aceptarInvitacion,
  actualizarUsuario, desactivarUsuario, activarUsuario,
  reenviarInvitacion, resetPassword,
  obtenerPermisos, guardarPermisos,
  listarDepartamentos, crearDepartamento, actualizarDepartamento, eliminarDepartamento,
  crearPuesto, eliminarPuesto,
} = require('../controllers/usuariosController');

// Ruta pública
router.post('/aceptar-invitacion', aceptarInvitacion);

router.use(authMiddleware);

// Usuarios
router.get('/',                           listarUsuarios);
router.post('/invitar',                   invitar);
router.put('/:id',                        actualizarUsuario);
router.delete('/:id',                     desactivarUsuario);
router.patch('/:id/activar',              activarUsuario);
router.post('/:id/reenviar-invitacion',   reenviarInvitacion);
router.put('/:id/reset-password',         resetPassword);

// Permisos
router.get('/:id/permisos',               obtenerPermisos);
router.post('/:id/permisos',              guardarPermisos);

// Departamentos
router.get('/departamentos',              listarDepartamentos);
router.post('/departamentos',             crearDepartamento);
router.put('/departamentos/:id',          actualizarDepartamento);
router.delete('/departamentos/:id',       eliminarDepartamento);

// Puestos
router.post('/puestos',                   crearPuesto);
router.delete('/puestos/:id',             eliminarPuesto);

module.exports = router;