/**
 * reviewRoutes.js
 * Route riêng cho tính năng đánh giá sản phẩm
 *
 * Public endpoints:
 *   GET  /api/reviews?product_id=xxx   → Lấy đánh giá theo sản phẩm
 *   POST /api/reviews                  → Khách hàng gửi đánh giá mới
 *
 * Admin endpoints:
 *   GET    /api/reviews/all            → Admin xem tất cả đánh giá
 *   PUT    /api/reviews/status         → Admin duyệt / ẩn đánh giá
 *   DELETE /api/reviews?id=xxx         → Admin xóa đánh giá
 */

const express = require('express');
const router = express.Router();
const {
    getReviewsByProduct,
    createReview,
    getAllReviews,
    updateReviewStatus,
    deleteReview
} = require('../controllers/reviewController');

// ─── PUBLIC ──────────────────────────────────────────────────────────────────
router.get('/', getReviewsByProduct);       // GET /api/reviews?product_id=sp-xxx
router.post('/', createReview);             // POST /api/reviews

// ─── ADMIN ───────────────────────────────────────────────────────────────────
router.get('/all', getAllReviews);          // GET /api/reviews/all
router.put('/status', updateReviewStatus); // PUT /api/reviews/status
router.delete('/', deleteReview);          // DELETE /api/reviews?id=rv-xxx

module.exports = router;
