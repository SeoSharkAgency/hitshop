const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');

router.get('/', categoryController.getAll);
router.post('/', authMiddleware, categoryController.create);

module.exports = router;
