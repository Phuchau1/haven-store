const mongoose = require('mongoose');
const { Schema } = mongoose;

const StockReceiptDetailSchema = new Schema({
    variant_id: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number }, // Giá nhập (nếu là nhập)
}, { _id: false });

const StockReceiptSchema = new Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, enum: ['IMPORT', 'EXPORT', 'TRANSFER', 'ADJUSTMENT'], required: true },
    warehouse_id: { type: String, required: true }, // Kho thực hiện
    dest_warehouse_id: { type: String }, // Kho đích (chỉ dùng khi TRANSFER)
    supplier_id: { type: String }, // (chỉ dùng khi IMPORT từ NCC)
    po_id: { type: String }, // Liên kết Đơn mua hàng (tùy chọn)
    reason: { type: String }, // Lý do xuất/nhập/điều chỉnh
    note: { type: String },
    user_id: { type: String, required: true }, // Người lập phiếu
    status: { type: String, enum: ['DRAFT', 'COMPLETED', 'CANCELLED'], default: 'DRAFT' },
    items: [StockReceiptDetailSchema],
    total_quantity: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 } // Tổng giá trị nhập
}, { timestamps: true });

const StockReceiptModel = mongoose.models.StockReceipt || mongoose.model('StockReceipt', StockReceiptSchema);

module.exports = { StockReceiptModel };
