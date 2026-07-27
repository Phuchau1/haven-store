/**
 * ============================================================
 * MODEL: SHIPPING EVENT — Mốc Tracking Vận Chuyển
 * Lưu từng sự kiện tracking theo chuẩn GHN/GHTK/J&T
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ShippingEventSchema = new Schema({
    orderId:            { type: String, required: true, index: true },
    status:             { type: String, required: true },
    title:              { type: String, required: true },       // VD: "Đã lấy hàng"
    location:           { type: String, default: '' },          // VD: "Bình Dương"
    note:               { type: String, default: '' },          // VD: "Đã bàn giao cho shipper"
    timestamp:          { type: Date, default: Date.now },
    isCustomerVisible:  { type: Boolean, default: true },       // true = khách thấy, false = nội bộ
    performedBy:        { type: String, default: 'system' },    // 'system' | 'admin' | carrier name
    carrierCode:        { type: String, default: '' },          // GHN | GHTK | JNT | VTP | BEST | NJV
}, { timestamps: true });

ShippingEventSchema.index({ orderId: 1, timestamp: 1 });

const ShippingEventModel = mongoose.models.ShippingEvent || mongoose.model('ShippingEvent', ShippingEventSchema);

module.exports = { ShippingEventModel };
