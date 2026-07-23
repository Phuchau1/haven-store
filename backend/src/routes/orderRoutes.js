const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateOrder } = require('../validators/orderValidator');
const { orderLimiter } = require('../middleware/rateLimiter');

router.get('/', orderController.getOrders);
router.post('/', orderLimiter, validateOrder, orderController.createOrder); // Rate limit đặt hàng — chống spam
router.put('/', validateOrder, orderController.updateOrderStatus);

module.exports = router;
