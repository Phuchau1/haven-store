const express = require('express');
const router = express.Router();
const { getAvailableCoupons, applyCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');

router.get('/available', getAvailableCoupons);
router.post('/apply', applyCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

module.exports = router;
