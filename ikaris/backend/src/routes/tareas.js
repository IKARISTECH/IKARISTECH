const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const {
  listarTareas, obtenerTarea, crearTarea,
  actualizarTarea, cambiarEstado, eliminarTarea,
  agregarComentario, subirArchivo, obtenerOpciones,
  obtenerMiEntrega, listarEntregas, subirEntrega,
  revisarEntrega, marcarVencidas,
} = require('../controllers/tareasController');

router.use(authMiddleware);

router.get('/',                    listarTareas);
router.get('/opciones',            obtenerOpciones);
router.get('/:id',                 obtenerTarea);
router.post('/',                   crearTarea);
router.put('/:id',                 actualizarTarea);
router.patch('/:id/estado',        cambiarEstado);
router.delete('/:id',              eliminarTarea);
router.post('/:id/comentarios',    agregarComentario);
router.post('/:id/archivos',       subirArchivo);

// Entregas individuales
router.get('/:id/mi-entrega',                    obtenerMiEntrega);
router.get('/:id/entregas',                      listarEntregas);
router.post('/:id/entregar',                     subirEntrega);
router.patch('/:id/entregas/:entregaId/revisar', revisarEntrega);
router.post('/marcar-vencidas',                  marcarVencidas);

module.exports = router;