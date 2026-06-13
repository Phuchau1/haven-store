const express = require('express');
const router = express.Router();
const stockReceiptController = require('../controllers/stockReceiptController');

router.get('/', stockReceiptController.getAll);
router.post('/', stockReceiptController.create);

module.exports = router;
