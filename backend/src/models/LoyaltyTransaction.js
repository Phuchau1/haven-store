/**
 * ============================================================
 * MODEL: LỊCH SỬ GIAO DỊCH ĐIỂM (LoyaltyTransaction)
 * Mô tả: Ghi lại từng lần cộng/trừ điểm của khách hàng.
 *        Dùng để audit, hiển thị lịch sử cho khách hàng.
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LoyaltyTransactionSchema = new Schema({
    userId:        { type: String, required: true, index: true },
    type:          {
        type: String,
        required: true,
        enum: ['earn', 'redeem', 'expire', 'bonus', 'admin_adjust'],
        // earn         → Tích điểm từ đơn hàng
        // redeem       → Đổi điểm lấy voucher
        // expire       → Thu hồi điểm do hủy đơn
        // bonus        → Thưởng điểm thủ công
        // admin_adjust → Admin điều chỉnh
    },
    points:        { type: Number, required: true },    // Số điểm cộng (+) hoặc trừ (-)
    orderId:       { type: String, default: null },     // Liên kết đơn hàng (nếu có)
    description:   { type: String, required: true },   // Mô tả giao dịch
    balanceBefore: { type: Number, required: true },   // Số điểm trước giao dịch
    balanceAfter:  { type: Number, required: true },   // Số điểm sau giao dịch
}, { timestamps: true });

const LoyaltyTransactionModel = mongoose.models.LoyaltyTransaction || mongoose.model('LoyaltyTransaction', LoyaltyTransactionSchema);

module.exports = { LoyaltyTransactionModel };
