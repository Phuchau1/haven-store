const mongoose = require('mongoose');
const { Schema } = mongoose;

const CouponSchema = new Schema({
    id: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    discount_type: { type: String, required: true, enum: ['percent', 'fixed'] },
    discount_value: { type: Number, required: true },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    usage_limit: { type: Number, required: true, default: 100 }
}, { timestamps: true });

const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

module.exports = { CouponModel };
