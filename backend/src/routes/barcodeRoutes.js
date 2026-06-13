const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/barcodeController');

router.get('/generate', barcodeController.generateBarcode);
router.get('/find', barcodeController.findByBarcode);

module.exports = router;
