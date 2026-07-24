const express = require('express');
const router  = express.Router();
const wmsController = require('../controllers/wmsController');

router.get('/dashboard',                wmsController.getWmsDashboard);
router.get('/inventory',                wmsController.getInventoryList);
router.get('/transactions',             wmsController.getTransactions);
router.post('/stocktake',               wmsController.performStocktake);
router.post('/adjust',                  wmsController.adjustStock);
router.get('/notifications',           wmsController.getNotifications);
router.get('/export',                   wmsController.exportInventory);
router.post('/import',                  wmsController.importInventory);
router.post('/waybill',                 wmsController.createCarrierWaybill);
router.post('/return-order',            wmsController.processReturnOrder);
router.get('/tracking/:trackingNumber', wmsController.getWaybillTracking);
router.get('/audit-logs',               wmsController.getAuditLogs);

module.exports = router;
