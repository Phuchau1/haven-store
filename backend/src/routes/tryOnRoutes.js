/**
 * ROUTES: AI VIRTUAL TRY-ON
 * Base: /api/tryon
 */
const express = require('express');
const router = express.Router();
const tryOnController = require('../controllers/tryOnController');
const { protect, admin } = require('../middleware/auth');
const { globalLimiter } = require('../middleware/rateLimiter');

// Validate chất lượng ảnh
router.post('/validate-image', tryOnController.validateImageQuality);

// Khởi tạo tiến trình thử đồ AI
router.post('/generate-job', globalLimiter, tryOnController.createTryOnJob);

// Kiểm tra trạng thái Job thời gian thực
router.get('/job-status/:jobId', tryOnController.getJobStatus);

// Lịch sử thử đồ cá nhân
router.get('/history', tryOnController.getHistory);
router.delete('/history/:id', tryOnController.deleteHistory);

// Admin Analytics Dashboard
router.get('/admin/analytics', protect, admin, tryOnController.getAdminAnalytics);

module.exports = router;
