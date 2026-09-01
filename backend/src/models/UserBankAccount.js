const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserBankAccountSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String },
    bankCode: { type: String, required: true }, // VCB, MB, TCB, ACB, ...
    bankName: { type: String, required: true }, // Tên ngân hàng
    accountNumber: { type: String, required: true }, // Số tài khoản
    accountHolder: { type: String, required: true }, // Tên chủ tài khoản (viết hoa không dấu)
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

UserBankAccountSchema.index({ userId: 1, isDefault: -1 });

const UserBankAccountModel = mongoose.models.UserBankAccount || mongoose.model('UserBankAccount', UserBankAccountSchema);

module.exports = { UserBankAccountModel };
