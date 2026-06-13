const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentMethodSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name_methond: { type: String, required: true },
    description: { type: String, required: true },
    bank_info: { type: String },
    qr_code_url: { type: String },
    is_active: { type: Boolean, required: true, default: true }
}, { timestamps: true });

const PaymentMethodModel = mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', PaymentMethodSchema);

module.exports = { PaymentMethodModel };
