const mongoose = require('mongoose');
const { Schema } = mongoose;

const SupplierSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    tax_code: { type: String }, // MST
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

const SupplierModel = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);

module.exports = { SupplierModel };
