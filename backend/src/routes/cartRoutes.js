const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/', cartController.getCart);
router.put('/', cartController.updateCart);
router.delete('/', cartController.clearCart);

module.exports = router;
