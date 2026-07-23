/**
 * ROUTES: ANALYTICS TRACKING
 * Base: /api/analytics
 */
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

// POST /api/analytics/track   — Ghi nhận sự kiện (Public)
router.post('/track', analyticsController.trackEvent);

// GET  /api/analytics/summary — Thống kê Admin Dashboard
router.get('/summary', protect, admin, analyticsController.getSummary);

// GET  /api/analytics/searches — Thống kê tìm kiếm (Admin)
router.get('/searches', protect, admin, analyticsController.getTopSearches);

module.exports = router;
