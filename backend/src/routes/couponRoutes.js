const express = require('express');
const router = express.Router();
const { getAvailableCoupons, getUserCoupons, applyCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const { protect } = require('../middleware/auth');

router.get('/available', getAvailableCoupons);
router.get('/my-coupons', protect, getUserCoupons);
router.post('/apply', applyCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

module.exports = router;

