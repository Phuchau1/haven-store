const mongoose = require('mongoose');
const { Schema } = mongoose;

const StockTransactionSchema = new Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, enum: ['IMPORT', 'EXPORT', 'TRANSFER', 'ADJUSTMENT', 'RETURN'], required: true },
    reference_id: { type: String }, // ID của StockReceipt, Order, hoặc PO
    warehouse_id: { type: String, required: true }, // Kho xảy ra biến động
    variant_id: { type: String, required: true }, // SKU hoặc ID của variant
    quantity: { type: Number, required: true }, // Số lượng thay đổi (dương hoặc âm)
    before_stock: { type: Number, required: true },
    after_stock: { type: Number, required: true },
    note: { type: String },
    user_id: { type: String } // Người thực hiện
}, { timestamps: true });

// Tối ưu query cho dashboard
StockTransactionSchema.index({ warehouse_id: 1, created_at: -1 });
StockTransactionSchema.index({ type: 1, created_at: -1 });

const StockTransactionModel = mongoose.models.StockTransaction || mongoose.model('StockTransaction', StockTransactionSchema);

module.exports = { StockTransactionModel };
