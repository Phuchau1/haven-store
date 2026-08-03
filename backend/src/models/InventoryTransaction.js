/**
 * ============================================================
 * MODEL: LỊCH SỬ GIAO DỊCH KHO (InventoryTransaction)
 * Ghi lại mọi thay đổi tồn kho với đầy đủ thông tin:
 *   - Ai thực hiện
 *   - Loại giao dịch (IMPORT, EXPORT, RESERVE, RELEASE, ADJUST, TRANSFER)
 *   - SKU, số lượng trước/sau
 *   - Liên kết đơn hàng / phiếu nhập
 * Không được xóa (immutable audit trail)
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const InventoryTransactionSchema = new Schema({
    transactionCode: { type: String, required: true, unique: true, index: true },

    // Loại giao dịch
    type: {
        type: String,
        required: true,
        enum: [
            'IMPORT',        // Nhập kho từ NCC
            'EXPORT_SALE',   // Xuất bán
            'EXPORT_DAMAGE', // Xuất hủy hàng hỏng
            'RESERVE',       // Giữ tồn khi tạo đơn
            'RELEASE',       // Hoàn tồn khi hủy đơn
            'DEDUCT',        // Trừ tồn chính thức khi giao hàng
            'ADJUST',        // Điều chỉnh tồn chung
            'ADJUST_IN',     // Điều chỉnh tăng (Nhập thêm)
            'ADJUST_OUT',    // Điều chỉnh giảm (Xác nhận xuất/báo hỏng)
            'ADJUST_UP',     // Điều chỉnh tăng
            'ADJUST_DOWN',   // Điều chỉnh giảm
            'TRANSFER_OUT',  // Chuyển kho ra
            'TRANSFER_IN',   // Chuyển kho vào
            'STOCKTAKE',     // Kiểm kê cân bằng
            'RETURN_IN',     // Nhập hàng trả lại
            'RETURN_DAMAGE'  // Nhập hàng trả lại hỏng
        ],
        index: true
    },

    // Thông tin SKU
    sku:         { type: String, required: true, index: true },
    productId:   { type: String, required: true },
    productName: { type: String, required: true },
    color:       { type: String, default: '' },
    size:        { type: String, default: '' },

    // Số lượng thay đổi
    quantityBefore: { type: Number, required: true },
    quantityChange: { type: Number, required: true }, // Dương = tăng, Âm = giảm
    quantityAfter:  { type: Number, required: true },

    // Loại tồn kho bị ảnh hưởng
    stockType: {
        type: String,
        enum: ['available', 'reserved', 'sold', 'damaged', 'transfer'],
        required: true
    },

    // Liên kết thực thể
    orderId:      { type: String, default: null, index: true },
    purchaseOrderId: { type: String, default: null },
    shipmentId:   { type: String, default: null },
    returnId:     { type: String, default: null },

    // Người thực hiện
    performedBy:  { type: String, required: true },
    performedByIp:{ type: String, default: '' },
    notes:        { type: String, default: '' },

    // Kho
    warehouseId:  { type: String, default: 'WH-MAIN-01' },
    warehouseName:{ type: String, default: 'Tổng Kho Hà Nội' }

}, {
    timestamps: true
});

// Index phức hợp cho query nhanh
InventoryTransactionSchema.index({ sku: 1, createdAt: -1 });
InventoryTransactionSchema.index({ orderId: 1, type: 1 });

module.exports = mongoose.model('InventoryTransaction', InventoryTransactionSchema);
