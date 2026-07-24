/**
 * ============================================================
 * MODEL: PHIẾU KIỂM KÊ KHO (Stocktake)
 * Quản lý đối chiếu số lượng tồn thực tế vs hệ thống
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const StocktakeItemSchema = new Schema({
    sku:             { type: String, required: true },
    productName:     { type: String, required: true },
    systemQuantity:  { type: Number, required: true, min: 0 },
    actualQuantity:  { type: Number, required: true, min: 0 },
    difference:      { type: Number, required: true }, // actual - system
    unitCost:        { type: Number, default: 0 },
    differenceValue: { type: Number, default: 0 }, // difference * unitCost
    reason:          { type: String, default: '' },
    notes:           { type: String, default: '' }
}, { _id: false });

const StocktakeSchema = new Schema({
    code:            { type: String, required: true, unique: true, index: true },
    warehouseId:     { type: String, default: 'WH-MAIN-01', index: true },
    warehouseName:   { type: String, default: 'Tổng Kho Hà Nội' },
    status:          { type: String, enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'DRAFT', index: true },
    performedBy:     { type: String, required: true },
    approvedBy:      { type: String, default: '' },
    stocktakeDate:   { type: Date, default: Date.now },
    items:           [StocktakeItemSchema],
    totalSystemQty:  { type: Number, default: 0 },
    totalActualQty:  { type: Number, default: 0 },
    totalDiffQty:    { type: Number, default: 0 },
    totalDiffValue:  { type: Number, default: 0 },
    notes:           { type: String, default: '' },
    adjustmentCode:  { type: String, default: '' } // Mã phiếu điều chỉnh kho sinh tự động
}, {
    timestamps: true
});

module.exports = mongoose.model('Stocktake', StocktakeSchema);
