const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserVoucherSchema = new Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    coupon_id: { type: String, required: true },
    is_use: { type: Boolean, required: true, default: false }
}, { timestamps: true });

const UserVoucherModel = mongoose.models.UserVoucher || mongoose.model('UserVoucher', UserVoucherSchema);

module.exports = { UserVoucherModel };
