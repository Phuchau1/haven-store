const mongoose = require('mongoose');

const spinRewardSchema = new mongoose.Schema({
    reward: { type: String, required: true },
    type: { type: String, enum: ['none', 'fixed', 'percent', 'shipping'], required: true },
    coupon_code: { type: String, default: '' },
    discount_value: { type: Number, default: 0 },
    probability: { type: Number, required: true },
    valid_hours: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, { timestamps: true });

const SpinReward = mongoose.models.SpinReward || mongoose.model('SpinReward', spinRewardSchema);

module.exports = SpinReward;
