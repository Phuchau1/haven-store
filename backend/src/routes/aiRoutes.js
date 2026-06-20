const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect, admin } = require('../middleware/auth'); // Require admin cho get/update settings

// Quản trị AI settings
router.get('/settings', protect, admin, aiController.getSettings);
router.put('/settings/:type', protect, admin, aiController.updateSetting);

// API Public để Frontend gọi sinh text/ảnh
router.post('/generate', aiController.generate);

module.exports = router;
