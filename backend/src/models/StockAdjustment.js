/**
 * ============================================================
 * MODEL: PHIẾU ĐIỀU CHỈNH KHO (StockAdjustment)
 * Ghi vết mọi thao tác điều chỉnh tăng/giảm tồn kho
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const StockAdjustmentItemSchema = new Schema({
    sku:            { type: String, required: true },
    productName:    { type: String, required: true },
    beforeQty:      { type: Number, required: true },
    adjustQty:      { type: Number, required: true }, // Dương: tăng, Âm: giảm
    afterQty:       { type: Number, required: true },
    reason:         { type: String, required: true }
}, { _id: false });

const StockAdjustmentSchema = new Schema({
    code:           { type: String, required: true, unique: true, index: true },
    stocktakeCode:  { type: String, default: '', index: true }, // Tham chiếu phiếu kiểm kê nếu có
    warehouseId:    { type: String, default: 'WH-MAIN-01', index: true },
    type:           { type: String, enum: ['STOCKTAKE', 'DAMAGE', 'LOST', 'FOUND', 'MANUAL'], required: true },
    status:         { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
    performedBy:    { type: String, required: true },
    approvedBy:     { type: String, default: '' },
    items:          [StockAdjustmentItemSchema],
    notes:          { type: String, default: '' },
    deviceIp:       { type: String, default: '127.0.0.1' }
}, {
    timestamps: true
});

module.exports = mongoose.model('StockAdjustment', StockAdjustmentSchema);
