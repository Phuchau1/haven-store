const express = require('express');
const router = express.Router();
const adminController      = require('../controllers/adminController');
const settingController    = require('../controllers/settingController');
const categoryController   = require('../controllers/categoryController');
const adminExtraController = require('../controllers/adminExtraController');
const articleController    = require('../controllers/articleController');
const auditMiddleware      = require('../middleware/auditMiddleware');

// ⭐ Audit log tự động cho mọi POST/PUT/DELETE trong khu vực admin
router.use(auditMiddleware('SystemConfig', 'admin_action'));

// ─── Users ───────────────────────────────────────────────────
router.get('/users',    adminController.getUsers);
router.put('/users',    adminController.updateUserRole);
router.delete('/users', adminController.deleteUser);

// ─── Stats ───────────────────────────────────────────────────
router.get('/stats', adminController.getStats);

// ─── Reviews ─────────────────────────────────────────────────
router.get('/reviews',        adminController.getAllReviews);
router.put('/reviews/status', adminController.updateReviewStatus);
router.delete('/reviews',     adminController.deleteReview);

// ─── Settings ────────────────────────────────────────────────
router.put('/settings', settingController.updateSettings);

// ─── Categories ──────────────────────────────────────────────
router.post('/categories',   categoryController.createCategory);
router.put('/categories',    categoryController.updateCategory);
router.delete('/categories', categoryController.deleteCategory);
router.put('/categories/reorder', categoryController.reorderCategories);

// ─── Subcategories ───────────────────────────────────────────
router.post('/categories/:categoryId/subcategories',              categoryController.addSubcategory);
router.put('/categories/:categoryId/subcategories/:subId',        categoryController.updateSubcategory);
router.delete('/categories/:categoryId/subcategories/:subId',     categoryController.deleteSubcategory);

// ─── Extra resources ─────────────────────────────────────────
router.get('/extra/:resource',    adminExtraController.getAll);
router.post('/extra/:resource',   adminExtraController.create);
router.put('/extra/:resource',    adminExtraController.update);
router.delete('/extra/:resource', adminExtraController.delete);

// ─── Articles (Bài viết) ─────────────────────────────────────
// ⭐ CRUD bài viết đặt ở đây để dùng chung auth admin
//    (không cần token riêng — auditMiddleware phía trên đã bao phủ)
router.get('/articles',         articleController.getArticles);
router.post('/articles',        articleController.createArticle);
router.put('/articles/:id',     articleController.updateArticle);
router.delete('/articles/:id',  articleController.deleteArticle);

module.exports = router;
