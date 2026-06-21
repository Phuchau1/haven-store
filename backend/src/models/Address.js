const mongoose = require('mongoose');
const { Schema } = mongoose;

const AddressSchema = new Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
    street: { type: String, required: true },
    is_default: { type: Boolean, required: true, default: false },
    created_at: { type: String, required: true, default: () => new Date().toISOString() }
}, { timestamps: true });

const AddressModel = mongoose.models.Address || mongoose.model('Address', AddressSchema);

module.exports = { AddressModel };
