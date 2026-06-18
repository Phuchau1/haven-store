const express = require('express');
const router = express.Router();
const { getAvailableCoupons, applyCoupon } = require('../controllers/couponController');

router.get('/available', getAvailableCoupons);
router.post('/apply', applyCoupon);

module.exports = router;
