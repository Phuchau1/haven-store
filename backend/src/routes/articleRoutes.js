/**
 * ============================================================
 * ROUTES: BÀI VIẾT
 *
 * PUBLIC  (không cần auth):
 *   GET  /api/articles       → Danh sách bài viết
 *   GET  /api/articles/:id   → Chi tiết bài viết
 *
 * ADMIN (qua /api/admin/articles — đã có auditMiddleware):
 *   GET    /api/admin/articles       → Danh sách (admin)
 *   POST   /api/admin/articles       → Tạo mới
 *   PUT    /api/admin/articles/:id   → Cập nhật
 *   DELETE /api/admin/articles/:id   → Xóa
 * ============================================================
 */
const express = require('express');
const router  = express.Router();
const {
    getArticles,
    getArticle,
    // createArticle, updateArticle, deleteArticle
    // → các action này đăng ký qua adminRoutes.js
} = require('../controllers/articleController');

// Public routes — không cần đăng nhập
router.get('/',    getArticles);
router.get('/:id', getArticle);

module.exports = router;
