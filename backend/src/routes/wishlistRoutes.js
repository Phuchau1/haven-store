const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { protect, admin } = require('../middleware/auth');

// Public/User routes
router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addWishlist);
router.delete('/clear', wishlistController.clearWishlist);
router.delete('/:productId', wishlistController.removeWishlist);

// Admin Analytics & Management routes
router.get('/admin-stats', protect, admin, wishlistController.getWishlistAdminStats);
router.get('/admin-products', protect, admin, wishlistController.getWishlistProductsAdmin);
router.get('/admin-products/:productId/users', protect, admin, wishlistController.getWishlistProductUsersAdmin);
router.get('/admin-customers', protect, admin, wishlistController.getWishlistCustomersAdmin);
router.get('/admin-customers/:userId', protect, admin, wishlistController.getWishlistCustomerDetailAdmin);

module.exports = router;
