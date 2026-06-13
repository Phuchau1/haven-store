const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateOrder } = require('../validators/orderValidator');

router.get('/', orderController.getOrders);
router.post('/', validateOrder, orderController.createOrder);
router.put('/', validateOrder, orderController.updateOrderStatus);

module.exports = router;
