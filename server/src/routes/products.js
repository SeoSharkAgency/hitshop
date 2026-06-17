const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', authMiddleware, upload.single('image'), productController.create);
router.put('/:id', authMiddleware, upload.single('image'), productController.update);
router.delete('/:id', authMiddleware, productController.remove);

module.exports = router;
