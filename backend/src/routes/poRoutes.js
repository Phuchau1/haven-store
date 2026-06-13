const express = require('express');
const router = express.Router();
const poController = require('../controllers/poController');

router.get('/', poController.getAll);
router.post('/', poController.create);
router.put('/status', poController.updateStatus);

module.exports = router;
