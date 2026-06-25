const router = require('express').Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const {
  listar, obtener, crear, actualizar, eliminar,
  listarRespuestas, crearRespuesta, actualizarRespuesta, eliminarRespuesta,
  subirArchivoRespuesta,
} = require('../controllers/formulariosController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});
router.use(authMiddleware);

router.get('/',    listar);
router.get('/:id', obtener);
router.post('/',   crear);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

router.get('/:id/respuestas',              listarRespuestas);
router.post('/:id/respuestas/archivo',     upload.single('archivo'), subirArchivoRespuesta);
router.post('/:id/respuestas',             crearRespuesta);
router.put('/:id/respuestas/:respId',      actualizarRespuesta);
router.delete('/:id/respuestas/bulk',      eliminarRespuesta); 
router.delete('/:id/respuestas/:respId',   eliminarRespuesta);

module.exports = router;