const express = require('express');
const router = express.Router();
const luckyWheelController = require('../controllers/luckyWheelController');
const { protect, admin } = require('../middleware/auth');

// Public / User routes
router.get('/config', luckyWheelController.getConfig); // Lấy danh sách giải thưởng để vẽ vòng quay
router.post('/spin', protect, luckyWheelController.spin); // Yêu cầu đăng nhập để quay

// Admin routes
router.post('/update-probs', luckyWheelController.updateProbabilities);

module.exports = router;
