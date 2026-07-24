/**
 * ============================================================
 * MODEL: PHIẾU CHUYỂN KHO (StockTransfer)
 * Quản lý điều chuyển hàng hóa giữa nhiều kho
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const StockTransferItemSchema = new Schema({
    sku:            { type: String, required: true },
    productName:    { type: String, required: true },
    quantity:       { type: Number, required: true, min: 1 }
}, { _id: false });

const StockTransferSchema = new Schema({
    code:              { type: String, required: true, unique: true, index: true },
    fromWarehouseId:   { type: String, required: true, index: true },
    fromWarehouseName: { type: String, required: true },
    toWarehouseId:     { type: String, required: true, index: true },
    toWarehouseName:   { type: String, required: true },
    status:            { type: String, enum: ['DRAFT', 'TRANSFERRING', 'RECEIVED', 'CANCELLED'], default: 'DRAFT', index: true },
    requestedBy:       { type: String, required: true },
    approvedBy:        { type: String, default: '' },
    receivedBy:        { type: String, default: '' },
    transferDate:      { type: Date, default: Date.now },
    receivedDate:      { type: Date },
    items:             [StockTransferItemSchema],
    notes:             { type: String, default: '' }
}, {
    timestamps: true
});

module.exports = mongoose.model('StockTransfer', StockTransferSchema);
