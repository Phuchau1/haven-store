/**
 * ============================================================
 * MODEL: THÔNG BÁO HỆ THỐNG KHO & CẢNH BÁO (Notification)
 * Cảnh báo tồn kho thấp, hết hàng, phiếu duyệt kho
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
    type:        { type: String, enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'STOCKTAKE_ALERT', 'PURCHASE_ORDER', 'SYSTEM'], default: 'LOW_STOCK', index: true },
    title:       { type: String, required: true },
    message:     { type: String, required: true },
    sku:         { type: String, default: '', index: true },
    warehouseId: { type: String, default: 'WH-MAIN-01' },
    isRead:      { type: Boolean, default: false, index: true },
    recipientRole:{ type: String, default: 'Warehouse Manager' },
    metadata:    { type: Schema.Types.Mixed, default: {} }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
