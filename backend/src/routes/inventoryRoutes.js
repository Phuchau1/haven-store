const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/history', inventoryController.getInventoryHistory);
router.get('/stock', inventoryController.getStockList);
router.post('/adjust', inventoryController.adjustInventory);
router.put('/stock', inventoryController.directSetStock);

module.exports = router;
