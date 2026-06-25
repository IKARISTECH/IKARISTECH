const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { getMetricas }    = require('../controllers/dashboardController');

router.get('/metricas', authMiddleware, getMetricas);

module.exports = router;