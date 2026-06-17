const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');

router.post('/', orderController.create);
router.get('/', authMiddleware, orderController.getAll);
router.get('/:id', authMiddleware, orderController.getById);
router.put('/:id', authMiddleware, orderController.updateStatus);

module.exports = router;
