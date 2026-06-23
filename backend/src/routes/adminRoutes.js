const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const settingController = require('../controllers/settingController');
const categoryController = require('../controllers/categoryController');
const adminExtraController = require('../controllers/adminExtraController');
const auditMiddleware = require('../middleware/auditMiddleware');

// Áp dụng Audit Log cho mọi thao tác POST/PUT/DELETE trong Admin
router.use(auditMiddleware('SystemConfig', 'admin_action'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.put('/users', adminController.updateUserRole);
router.delete('/users', adminController.deleteUser);

// Reviews management
router.get('/reviews', adminController.getAllReviews);
router.put('/reviews/status', adminController.updateReviewStatus);
router.delete('/reviews', adminController.deleteReview);

// Settings management
router.put('/settings', settingController.updateSettings);

// ─── Categories management (admin) ─────────────────────────────────────────
router.post('/categories', categoryController.createCategory);
router.put('/categories', categoryController.updateCategory);
router.delete('/categories', categoryController.deleteCategory);
router.put('/categories/reorder', categoryController.reorderCategories);

// ─── Subcategories management ───────────────────────────────────────────────
router.post('/categories/:categoryId/subcategories', categoryController.addSubcategory);
router.put('/categories/:categoryId/subcategories/:subId', categoryController.updateSubcategory);
router.delete('/categories/:categoryId/subcategories/:subId', categoryController.deleteSubcategory);

// Extra resources (Banners, Colors, Sizes, Coupons, PaymentMethods, ShippingMethods)
router.get('/extra/:resource', adminExtraController.getAll);
router.post('/extra/:resource', adminExtraController.create);
router.put('/extra/:resource', adminExtraController.update);
router.delete('/extra/:resource', adminExtraController.delete);

module.exports = router;
