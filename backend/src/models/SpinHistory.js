const mongoose = require('mongoose');

/**
 * SpinHistory – Lịch sử mỗi lượt quay vòng may mắn
 * Liên kết trực tiếp với UserCoupon qua voucher_id để tránh tìm theo time range.
 */
const spinHistorySchema = new mongoose.Schema({
    user_id:     { type: String, required: true, index: true },  // custom user id string
    reward_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'SpinReward' },
    reward_text: { type: String, required: true },
    voucher_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'UserCoupon', default: null },
    spin_date:   { type: Date, default: Date.now, index: true },
    ip:          { type: String, default: '' },   // IP address khi quay
    device:      { type: String, default: '' },   // User-agent / device info
}, { timestamps: true });

const SpinHistory = mongoose.models.SpinHistory || mongoose.model('SpinHistory', spinHistorySchema);

module.exports = SpinHistory;
