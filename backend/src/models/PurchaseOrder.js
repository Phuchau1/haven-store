const mongoose = require('mongoose');
const { Schema } = mongoose;

const PODetailSchema = new Schema({
    variant_id: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
}, { _id: false });

const PurchaseOrderSchema = new Schema({
    id: { type: String, required: true, unique: true },
    supplier_id: { type: String, required: true },
    warehouse_id: { type: String, required: true }, // Nơi dự kiến nhập hàng
    status: { type: String, enum: ['DRAFT', 'PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED'], default: 'DRAFT' },
    user_id: { type: String, required: true }, // Người tạo
    expected_date: { type: String },
    items: [PODetailSchema],
    total_amount: { type: Number, default: 0 },
    note: { type: String }
}, { timestamps: true });

const PurchaseOrderModel = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', PurchaseOrderSchema);

module.exports = { PurchaseOrderModel };
