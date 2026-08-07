const mongoose = require('mongoose');

/**
 * SpinReward – Các ô phần thưởng trong vòng quay may mắn.
 * quantity/remaining dùng để giới hạn số lượng phát thưởng.
 */
const spinRewardSchema = new mongoose.Schema({
    reward:         { type: String, required: true },
    type:           { type: String, default: 'none' }, // 'none', 'fixed', 'percent', 'shipping', 'discount', 'voucher', v.v.
    coupon_code:    { type: String, default: '' },      // Prefix mã (vd: SPIN20)
    discount_value: { type: Number, default: 0 },
    probability:    { type: Number, required: true },   // Tỷ lệ phần trăm
    valid_hours:    { type: Number, default: 24 },      // Thời hạn voucher (giờ)
    quantity:       { type: Number, default: 0 },       // 0 = không giới hạn
    remaining:      { type: Number, default: 0 },       // Số lượng còn lại
    color:          { type: String, default: '' },      // Màu ô phần thưởng
    active:         { type: Boolean, default: true },
}, { timestamps: true });

const SpinReward = mongoose.models.SpinReward || mongoose.model('SpinReward', spinRewardSchema);

module.exports = SpinReward;
