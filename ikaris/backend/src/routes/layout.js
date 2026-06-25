const router = require('express').Router();
const { authMiddleware }        = require('../middleware/auth');
const { getLayout, saveLayout } = require('../controllers/layoutController');

router.get('/',  authMiddleware, getLayout);
router.post('/', authMiddleware, saveLayout);

module.exports = router;