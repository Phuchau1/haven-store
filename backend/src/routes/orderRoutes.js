const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateOrder } = require('../validators/orderValidator');
const { orderLimiter } = require('../middleware/rateLimiter');

router.get('/', orderController.getOrders);
router.post('/', orderLimiter, validateOrder, orderController.createOrder); // Rate limit đặt hàng — chống spam
router.put('/', validateOrder, orderController.updateOrderStatus);

// ─── HOÀN HÀNG (Return & Refund) ─────────────────────────
router.post('/return-request', orderController.submitReturnRequest);
router.get('/returns', orderController.getReturnRequests);
router.put('/return-request/:orderId', orderController.reviewReturnRequest);
router.put('/return-received/:orderId', orderController.confirmReturnReceived); // Step 2: Admin xác nhận nhận hàng & hoàn tiền

module.exports = router;
