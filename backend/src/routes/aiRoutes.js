const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const aiChatController = require('../controllers/aiChatController');
const { protect, admin } = require('../middleware/auth');

// Public route: Khách hàng thử đồ ảo
router.post('/virtual-try-on', aiController.virtualTryOn);

// Public route: Chat hỏi giá sản phẩm
router.post('/chat', aiChatController.chatPriceQuery);

// Admin route: Tạo mô tả sản phẩm bằng AI
router.post('/generate', protect, admin, aiController.generateContent);

module.exports = router;

