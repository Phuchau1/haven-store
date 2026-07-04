const express = require('express');
const router = express.Router();
const luckyWheelController = require('../controllers/luckyWheelController');
const { protect, admin } = require('../middleware/auth');

// Public / User routes
router.get('/config', luckyWheelController.getConfig);
router.get('/can-spin', luckyWheelController.canSpin);  // GET /api/lucky-wheel/can-spin?user_id=xxx
router.post('/spin', protect, luckyWheelController.spin);

// Admin routes
router.put('/config', protect, admin, luckyWheelController.updateConfig);

module.exports = router;
