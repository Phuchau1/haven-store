/**
 * ============================================================
 * ROUTE: WMS ENTERPRISE & LOGISTICS ROUTER
 * ============================================================
 */
const express = require('express');
const router  = express.Router();
const wmsController = require('../controllers/wmsController');

router.get('/dashboard',                wmsController.getWmsDashboard);
router.get('/inventory',                wmsController.getInventoryList);
router.post('/stocktake',               wmsController.performStocktake);
router.post('/waybill',                 wmsController.createCarrierWaybill);
router.get('/tracking/:trackingNumber', wmsController.getWaybillTracking);
router.get('/audit-logs',               wmsController.getAuditLogs);

module.exports = router;
