const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlistItem);

module.exports = router;
