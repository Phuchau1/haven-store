const mongoose = require('mongoose');
const { Schema } = mongoose;

const ShippingMethodSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name_methond: { type: String, required: true },
    description: { type: String, required: true },
    is_active: { type: Boolean, required: true, default: true },
    cost: { type: Number, required: true, default: 0 },
    free_shipping_threshold: { type: Number, required: true, default: 0 },
    estimated_time: { type: String, default: '2-3 ngày' }
}, { timestamps: true });

const ShippingMethodModel = mongoose.models.ShippingMethod || mongoose.model('ShippingMethod', ShippingMethodSchema);

module.exports = { ShippingMethodModel };
