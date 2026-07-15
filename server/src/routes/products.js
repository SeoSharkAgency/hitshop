const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', authMiddleware, requireRole('admin', 'warehouse'), upload.single('image'), productController.create);
router.put('/:id', authMiddleware, requireRole('admin', 'warehouse'), upload.single('image'), productController.update);
router.delete('/:id', authMiddleware, requireRole('admin'), productController.remove);

module.exports = router;
