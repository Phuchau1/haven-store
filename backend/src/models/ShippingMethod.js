const mongoose = require('mongoose');
const { Schema } = mongoose;

const ShippingMethodSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name_methond: { type: String, required: true },
    description: { type: String, required: true },
    is_active: { type: Boolean, required: true, default: true }
}, { timestamps: true });

const ShippingMethodModel = mongoose.models.ShippingMethod || mongoose.model('ShippingMethod', ShippingMethodSchema);

module.exports = { ShippingMethodModel };
