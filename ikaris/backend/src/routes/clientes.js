const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const {
  listarClientes, obtenerCliente, crearCliente,
  actualizarCliente, eliminarCliente, estadisticasClientes,
} = require('../controllers/clientesController');

router.use(authMiddleware);
router.get('/estadisticas', estadisticasClientes);
router.get('/',    listarClientes);
router.get('/:id', obtenerCliente);
router.post('/',   crearCliente);
router.put('/:id', actualizarCliente);
router.delete('/:id', eliminarCliente);

module.exports = router;