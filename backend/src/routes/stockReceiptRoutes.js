const express = require('express');
const router = express.Router();
const stockReceiptController = require('../controllers/stockReceiptController');

router.get('/', stockReceiptController.getAll);
router.post('/', stockReceiptController.create);
router.get('/:id', stockReceiptController.getById);
router.put('/:id', stockReceiptController.update);
router.put('/:id/approve', stockReceiptController.approve);
router.delete('/:id', stockReceiptController.delete);

module.exports = router;
