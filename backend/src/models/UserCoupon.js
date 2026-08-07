const mongoose = require('mongoose');

/**
 * UserCoupon – Voucher cá nhân được phát khi người dùng quay trúng thưởng.
 * Liên kết với SpinHistory qua spin_history_id.
 */
const userCouponSchema = new mongoose.Schema({
    user_id:         { type: String, required: true, index: true },
    spin_history_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SpinHistory', default: null },
    reward_name:     { type: String, default: '' },      // Tên phần thưởng vd: "Giảm 20.000đ"
    coupon_code:     { type: String, required: true, unique: true },
    type:            { type: String, default: 'fixed' }, // 'fixed', 'percent', 'shipping'
    discount_value:  { type: Number, default: 0 },
    expires_at:      { type: Date, required: true },
    is_used:         { type: Boolean, default: false },
    used_at:         { type: Date, default: null },      // Thời điểm sử dụng
}, { timestamps: true });

const UserCoupon = mongoose.models.UserCoupon || mongoose.model('UserCoupon', userCouponSchema);

module.exports = UserCoupon;
