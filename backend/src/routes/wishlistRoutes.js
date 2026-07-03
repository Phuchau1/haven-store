const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

router.get('/admin-stats', wishlistController.getWishlistAdminStats);
router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addWishlist);
router.delete('/clear', wishlistController.clearWishlist);
router.delete('/:productId', wishlistController.removeWishlist);

module.exports = router;
