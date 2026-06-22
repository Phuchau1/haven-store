const mongoose = require('mongoose');

const spinHistorySchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    reward_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SpinReward' },
    reward_text: { type: String, required: true },
    spin_date: { type: Date, default: Date.now }
}, { timestamps: true });

const SpinHistory = mongoose.models.SpinHistory || mongoose.model('SpinHistory', spinHistorySchema);

module.exports = SpinHistory;
