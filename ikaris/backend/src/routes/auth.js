const router      = require('express').Router();
const rateLimit   = require('express-rate-limit');
const { registro, login, refresh, logout, me,
        solicitarCodigo, verificarInvitacion }    = require('../controllers/authController');
const { authMiddleware }                          = require('../middleware/auth');
const { validar, registroSchema,
        loginSchema, codigoSchema }               = require('../utils/validaciones');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Demasiados intentos. Espera 15 minutos.' },
  skipSuccessfulRequests: true,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { success: false, message: 'Espera un momento antes de reenviar.' },
});

router.post('/solicitar-codigo', emailLimiter,  solicitarCodigo);
router.post('/registro',         authLimiter,   validar(registroSchema), registro);
router.post('/login',            authLimiter,   validar(loginSchema),    login);
router.post('/refresh',          refresh);
router.post('/logout',           authMiddleware, logout);
router.get('/me',                authMiddleware, me);

module.exports = router;