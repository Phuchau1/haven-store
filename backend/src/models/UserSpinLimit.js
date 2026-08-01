const mongoose = require('mongoose');

/**
 * UserSpinLimit – Theo dõi số lượt quay mỗi ngày của từng user.
 * Dùng để giới hạn lượt quay (vd: 1 lần/ngày) nhanh và chính xác hơn
 * so với đếm SpinHistory.
 * 
 * Index compound { user_id, spin_date } để đảm bảo tính unique.
 */
const userSpinLimitSchema = new mongoose.Schema({
    user_id:    { type: String, required: true },
    spin_date:  { type: String, required: true }, // format: 'YYYY-MM-DD' để so sánh theo ngày
    spin_count: { type: Number, default: 0 },
}, { timestamps: true });

// Đảm bảo mỗi user chỉ có 1 bản ghi mỗi ngày
userSpinLimitSchema.index({ user_id: 1, spin_date: 1 }, { unique: true });

const UserSpinLimit = mongoose.models.UserSpinLimit || mongoose.model('UserSpinLimit', userSpinLimitSchema);

module.exports = UserSpinLimit;
