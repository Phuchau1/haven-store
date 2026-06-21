const mongoose = require('mongoose');

const userCouponSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    coupon_code: { type: String, required: true },
    type: { type: String, required: true }, // 'fixed', 'percent', 'shipping'
    discount_value: { type: Number, required: true },
    expires_at: { type: Date, required: true },
    is_used: { type: Boolean, default: false }
}, { timestamps: true });

const UserCoupon = mongoose.models.UserCoupon || mongoose.model('UserCoupon', userCouponSchema);

module.exports = UserCoupon;
