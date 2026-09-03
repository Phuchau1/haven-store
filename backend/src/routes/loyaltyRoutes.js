/**
 * ROUTES: ĐIỂM TÍCH LŨY & ĐỔI THƯỞNG (Loyalty & Rewards)
 * Base: /api/loyalty
 */
const express = require('express');
const router  = express.Router();
const loyaltyController = require('../controllers/loyaltyController');

// GET  /api/loyalty/me          — Xem điểm, cấp bậc, thanh tiến trình & lịch sử
router.get('/me', loyaltyController.getMyPoints);

// POST /api/loyalty/redeem      — Đổi điểm lấy Voucher (tự động cấp UserCoupon)
router.post('/redeem', loyaltyController.redeemPoints);

// GET  /api/loyalty/leaderboard — Bảng xếp hạng Top 20 khách VIP
router.get('/leaderboard', loyaltyController.getLeaderboard);

// ─── ADMIN MANAGEMENT ROUTES ───
// GET  /api/loyalty/admin/stats  — Báo cáo KPI điểm tích lũy toàn sàn
router.get('/admin/stats', loyaltyController.getLoyaltyStats);

// POST /api/loyalty/admin/adjust — Admin tặng điểm thưởng hoặc điều chỉnh điểm
router.post('/admin/adjust', loyaltyController.adminAdjustPoints);

module.exports = router;
