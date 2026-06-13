const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validateProduct } = require('../validators/productValidator');

router.get('/', productController.getProducts);
router.post('/', validateProduct, productController.createProduct);
router.put('/', validateProduct, productController.updateProduct);
router.delete('/', productController.deleteProduct);

// Product reviews routes
router.get('/reviews', productController.getProductReviews);
router.post('/reviews', productController.createProductReview);

module.exports = router;
