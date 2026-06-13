const express = require('express');
const router = express.Router();
const inventoryReportController = require('../controllers/inventoryReportController');

router.get('/dashboard-stats', inventoryReportController.getDashboardStats);
router.get('/transactions', inventoryReportController.getTransactions);

module.exports = router;
