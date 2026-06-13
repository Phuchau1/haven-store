const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

router.get('/', warehouseController.getAll);
router.post('/', warehouseController.create);
router.put('/', warehouseController.update);
router.delete('/', warehouseController.delete);

module.exports = router;
