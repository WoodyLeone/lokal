const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Product matching endpoint
router.post('/match', productController.matchProducts);

// Get demo products
router.get('/demo', productController.getDemoProducts);

// Get all products
router.get('/', productController.getAllProducts);

// Get product by ID
router.get('/:productId', productController.getProductById);

// Get products by category
router.get('/category/:category', productController.getProductsByCategory);

module.exports = router; 