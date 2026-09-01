const mongoose = require('mongoose');
const { Schema } = mongoose;

const WithdrawalRequestSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true }, // Mã yêu cầu: WDR-XXXXXX
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, default: '' },
    userPhone: { type: String, default: '' },
    amount: { type: Number, required: true, min: 10000 }, // Số tiền rút (VNĐ)
    fee: { type: Number, default: 0 }, // Phí rút tiền (VNĐ)
    netAmount: { type: Number, required: true }, // Số tiền thực nhận = amount - fee
    bankInfo: {
        bankCode: { type: String, required: true }, // Mã ngân hàng (VCB, MB, TCB, ACB, ...)
        bankName: { type: String, required: true }, // Tên ngân hàng
        accountNumber: { type: String, required: true }, // Số tài khoản ngân hàng
        accountHolder: { type: String, required: true }  // Tên chủ tài khoản
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'completed'], 
        default: 'pending',
        index: true 
    },
    note: { type: String, default: '' }, // Ghi chú từ khách hàng
    adminNote: { type: String, default: '' }, // Ghi chú / lý do từ chối từ admin
    processedBy: { type: String, default: '' }, // Admin ID duyệt
    processedAt: { type: Date },
    proofImage: { type: String, default: '' } // Ảnh chứng từ chuyển khoản
}, { timestamps: true });

WithdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });

const WithdrawalRequestModel = mongoose.models.WithdrawalRequest || mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);

module.exports = { WithdrawalRequestModel };
