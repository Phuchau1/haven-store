const express = require('express');
const router = express.Router();
const flashSaleController = require('../controllers/flashSaleController');
// Assuming authMiddleware has an isAdmin check or something similar
// const { verifyToken, isAdmin } = require('../middleware/auth'); // Optional if not strict yet

// Public route for frontend
router.get('/active', flashSaleController.getActiveFlashSale);

// Admin dashboard route
router.get('/admin/dashboard', flashSaleController.getFlashSaleDashboard);

// Admin CRUD routes
router.get('/admin', flashSaleController.getAdminFlashSales);
router.post('/admin', flashSaleController.createFlashSale);
router.put('/admin/:id', flashSaleController.updateFlashSale);
router.delete('/admin/:id', flashSaleController.deleteFlashSale);

module.exports = router;
