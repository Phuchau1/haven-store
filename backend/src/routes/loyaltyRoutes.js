/**
 * ROUTES: ĐIỂM TÍCH LŨY (Loyalty Points)
 * Base: /api/loyalty
 */
const express = require('express');
const router  = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
const { protect, admin } = require('../middleware/auth');

// GET  /api/loyalty/me          — Xem điểm & lịch sử của tôi (dùng x-user-id header)
router.get('/me', loyaltyController.getMyPoints);

// POST /api/loyalty/redeem      — Đổi điểm lấy voucher
router.post('/redeem', protect, loyaltyController.redeemPoints);

// GET  /api/loyalty/leaderboard — Bảng xếp hạng khách VIP (Admin only)
router.get('/leaderboard', protect, admin, loyaltyController.getLeaderboard);

module.exports = router;
