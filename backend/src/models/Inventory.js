/**
 * ============================================================
 * MODEL: QUẢN LÝ TỒN KHO ENTERPRISE (Inventory)
 * Quản lý chi tiết 6 trạng thái tồn kho chuẩn WMS/ERP:
 *   - available: Sẵn sàng bán
 *   - reserved:  Đang giữ hàng cho đơn (chưa giao)
 *   - sold:      Đã giao bán thành công
 *   - damaged:   Hàng hỏng / lỗi sản xuất
 *   - transfer:  Hàng đang trung chuyển
 *   - safetyStock: Tồn tối thiểu an toàn
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const InventorySchema = new Schema({
    sku:            { type: String, required: true, unique: true, index: true },
    productId:      { type: String, required: false, default: '', index: true },
    productName:    { type: String, required: true },
    color:          { type: String, default: '' },
    size:           { type: String, default: '' },
    barcode:        { type: String, default: '' },
    warehouseId:    { type: String, default: 'WH-MAIN-01', index: true },
    warehouseName:  { type: String, default: 'Tổng Kho Hà Nội' },
    locationRack:   { type: String, default: 'A-01-01' }, // Kệ / Vị trí kho

    // --- 6 Trạng thái Tồn kho ---
    available:      { type: Number, required: true, default: 0, min: 0 },
    reserved:       { type: Number, required: true, default: 0, min: 0 },
    sold:           { type: Number, required: true, default: 0, min: 0 },
    damaged:        { type: Number, required: true, default: 0, min: 0 },
    transfer:       { type: Number, required: true, default: 0, min: 0 },

    // --- Giới hạn cảnh báo tồn kho ---
    minStock:       { type: Number, default: 5 },
    maxStock:       { type: Number, default: 200 },
    safetyStock:    { type: Number, default: 10 },
    costPrice:      { type: Number, default: 0 }, // Giá vốn nhập kho (VND)
    sellingPrice:   { type: Number, default: 0 }, // Giá bán (VND)

    status:         { type: String, enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED'], default: 'IN_STOCK' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Inventory', InventorySchema);
