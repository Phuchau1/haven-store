/**
 * ============================================================
 * MODEL: ĐIỂM TÍCH LŨY (LoyaltyPoints)
 * Mô tả: Lưu tổng điểm và cấp độ thành viên của từng khách hàng.
 * Cấp độ:
 *   Bronze   →    0 -   999 điểm  (Đồng)
 *   Silver   → 1000 -  4999 điểm  (Bạc)
 *   Gold     → 5000 - 19999 điểm  (Vàng)
 *   Platinum → 20000+      điểm   (Kim cương)
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LoyaltyPointsSchema = new Schema({
    userId:      { type: String, required: true, unique: true, index: true }, // ID người dùng
    points:      { type: Number, required: true, default: 0 },               // Điểm hiện tại có thể dùng
    level: {
        type: String,
        required: true,
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
        default: 'Bronze'
    },
    totalEarned: { type: Number, required: true, default: 0 },               // Tổng điểm đã tích lũy
    totalSpent:  { type: Number, required: true, default: 0 },               // Tổng điểm đã đổi/tiêu
}, { timestamps: true });

/**
 * Tính cấp độ thành viên dựa trên tổng điểm tích lũy (totalEarned)
 */
LoyaltyPointsSchema.methods.calculateLevel = function () {
    if (this.totalEarned >= 20000) return 'Platinum';
    if (this.totalEarned >= 5000)  return 'Gold';
    if (this.totalEarned >= 1000)  return 'Silver';
    return 'Bronze';
};

const LoyaltyPointsModel = mongoose.models.LoyaltyPoints || mongoose.model('LoyaltyPoints', LoyaltyPointsSchema);

module.exports = { LoyaltyPointsModel };
