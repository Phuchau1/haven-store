/**
 * ============================================================
 * ROUTE: AI VIRTUAL TRY-ON
 * Hỗ trợ tất cả alias routes để không bao giờ bị 404
 * ============================================================
 */
const express = require('express');
const router  = express.Router();
const tryOnController = require('../controllers/tryOnController');

// Health check
router.get('/health', (req, res) => res.json({ success: true, message: 'TryOn API Service is running' }));
router.get('/ping', (req, res) => res.json({ success: true, message: 'pong' }));

// Endpoints thử đồ AI (hỗ trợ nhiều alias route)
router.post('/run', tryOnController.runTryOn);
router.post('/generate-job', tryOnController.runTryOn);
router.post('/', tryOnController.runTryOn);

module.exports = router;
