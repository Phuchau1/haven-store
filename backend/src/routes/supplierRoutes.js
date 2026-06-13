const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

router.get('/', supplierController.getAll);
router.post('/', supplierController.create);
router.put('/', supplierController.update);
router.delete('/', supplierController.delete);

module.exports = router;
