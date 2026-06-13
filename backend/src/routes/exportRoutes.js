const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

router.get('/excel/transactions', exportController.exportTransactionsExcel);
router.get('/pdf/receipt', exportController.printReceiptPDF);

module.exports = router;
