/**
 * ============================================================
 * ROUTE: AI VIRTUAL TRY-ON
 * POST /api/tryon/run  — Đồng bộ, trả kết quả trực tiếp (~30-90s)
 * ============================================================
 */
const express = require('express');
const router  = express.Router();
const tryOnController = require('../controllers/tryOnController');

// Endpoint chính: Thử đồ AI (synchronous)
router.post('/run', tryOnController.runTryOn);

module.exports = router;
