const express = require('express');
const router = express.Router();
const { calculateShipping } = require('../controllers/shippingController');

// POST /api/shipping/calculate
router.post('/calculate', calculateShipping);

module.exports = router;
