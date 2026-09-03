/**
 * ============================================================
 * MODEL: ĐƠN HÀNG (Order) — Enterprise Edition v2.0
 * Chuẩn: TikTok Shop / Shopee với 20 trạng thái đầy đủ
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------- Sub-schema: Thông tin sản phẩm trong đơn hàng ---------- */
const OrderItemProductSchema = new Schema({
    id:            { type: String, required: true },
    name:          { type: String, required: true },
    price:         { type: Number, required: true },
    originalPrice: { type: Number },
    category:      { type: String },
    categoryLabel: { type: String },
    images:        [{ type: String }],
    sizes:         [{ type: String }],
    colors: [{ name: { type: String }, hex: { type: String } }],
    description:   { type: String },
    badge:         { type: String },
    rating:        { type: Number },
    reviews:       { type: Number },
    inStock:       { type: Boolean }
}, { _id: false });

/* ---------- Sub-schema: Từng mục hàng ---------- */
const OrderItemSchema = new Schema({
    product:       { type: OrderItemProductSchema, required: true },
    quantity:      { type: Number, required: true, default: 1 },
    selectedSize:  { type: String, required: true },
    selectedColor: { name: { type: String, required: true }, hex: { type: String, required: true } }
}, { _id: false });

/* ---------- Sub-schema: Shipping Timeline Event ---------- */
const ShippingTimelineEventSchema = new Schema({
    status:    { type: String, required: true },
    title:     { type: String, required: true },
    location:  { type: String, default: '' },
    note:      { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    isCustomerVisible: { type: Boolean, default: true }
}, { _id: false });

/* ---------- Schema chính: Đơn hàng ---------- */
const OrderSchema = new Schema({
    id:              { type: String, required: true, unique: true },
    customerName:    { type: String, required: true },
    phone:           { type: String, required: true },
    email:           { type: String, required: true },
    address:         { type: String, required: true },
    paymentMethod:   { type: String, required: true },
    items:           [OrderItemSchema],
    totalAmount:     { type: Number, required: true },
    shippingFee:     { type: Number, default: 0 },
    shippingMethodId:{ type: String },
    couponCode:      { type: String, default: '' },
    discountAmount:  { type: Number, default: 0 },
    finalAmount:     { type: Number, default: 0 },
    note:            { type: String },
    userId:          { type: String, default: null },
    transferReceipt: { type: String, default: '' },
    shippingProvider:{ type: String },
    carrierCode:     { type: String, default: '' },
    trackingNumber:  { type: String, default: '' },

    // ─── 20 TRẠNG THÁI CHUẨN TIKTOK SHOP / SHOPEE ────────────────────────────
    status: {
        type: String,
        required: true,
        enum: [
            'pending',              // Chờ xác nhận
            'confirmed',            // Đã xác nhận (shop duyệt)
            'processing',           // Đang chuẩn bị / đóng gói
            'waiting_pickup',       // Chờ đơn vị vận chuyển lấy hàng
            'picked_up',            // Đơn vị vận chuyển đã lấy hàng
            'in_transit',           // Đang vận chuyển / trung chuyển
            'out_for_delivery',     // Đang giao (shipper đang trên đường)
            'delivered',            // Giao hàng thành công
            'completed',            // Hoàn tất (sau khi hết thời gian khiếu nại)
            'awaiting_review',      // Chờ đánh giá
            'reviewed',             // Đã đánh giá
            'return_requested',     // Khách yêu cầu trả hàng (chờ shop duyệt)
            'returning',            // Đang gửi hàng trả về shop
            'return_received',      // Shop đã nhận hàng trả
            'refunded',             // Đã hoàn tiền
            'cancelled',            // Đã hủy
            'delivery_failed',      // Giao hàng thất bại
            'returned_to_seller',   // Hàng hoàn về shop (do giao thất bại)
            'dispute',              // Đang khiếu nại
            'refund_requested'      // Yêu cầu hoàn tiền (chờ xử lý)
        ],
        default: 'pending'
    },

    // ─── SHIPPING TIMELINE — Lịch sử tracking từng mốc ───────────────────────
    shippingTimeline: [ShippingTimelineEventSchema],
    estimatedDelivery: { type: Date, default: null },

    // ─── TIMESTAMPS MỐC QUAN TRỌNG ───────────────────────────────────────────
    confirmedAt:        { type: Date, default: null },
    processingAt:       { type: Date, default: null },
    pickedUpAt:         { type: Date, default: null },
    inTransitAt:        { type: Date, default: null },
    outForDeliveryAt:   { type: Date, default: null },
    deliveredAt:        { type: Date, default: null },
    cancelledAt:        { type: Date, default: null },

    // ─── RETURN REQUEST (SLA ENGINE & TRACKING) ──────────────────────────────
    returnRequest: {
        status:               { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
        returnType:           { type: String, enum: ['return_and_refund', 'refund_only'], default: 'return_and_refund' },
        returnItems:          [{
            productId:        { type: String },
            name:             { type: String },
            image:            { type: String },
            size:             { type: String },
            color:            { type: String },
            quantity:         { type: Number, default: 1 },
            price:            { type: Number, default: 0 },
            refundAmount:     { type: Number, default: 0 }
        }],
        reason:               { type: String, default: '' },
        customReason:         { type: String, default: '' },
        description:          { type: String, default: '' },
        images:               [{ type: String }],
        videoUrl:             { type: String, default: '' },
        estimatedRefundAmount:{ type: Number, default: 0 },
        refundMethod:         { type: String, default: 'wallet' }, // 'wallet' | 'original' | 'bank_transfer'
        bankInfo: {
            bankName:         { type: String, default: '' },
            accountNumber:    { type: String, default: '' },
            accountHolder:    { type: String, default: '' }
        },
        requestedAt:          { type: Date },
        reviewDeadline:       { type: Date },       // Hạn chót shop duyệt (requestedAt + 48h)
        reviewedAt:           { type: Date },
        reviewedBy:           { type: String, default: '' },
        rejectReason:         { type: String, default: '' },
        warehouseAddress:     { type: String, default: 'Kho Tổng HAVEN - 123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh (Hotline: 1900 6868)' },
        
        // Khách gửi hàng hoàn
        shippingDeadline:     { type: Date },       // Hạn chót khách gửi hàng (reviewedAt + 5 ngày)
        returnTrackingNumber: { type: String, default: '' }, // Mã vận đơn trả hàng
        returnCarrier:        { type: String, default: '' }, // Đơn vị VC (GHN, GHTK, Viettel Post...)
        returnShippedAt:      { type: Date },       // Thời điểm khách gửi hàng
        
        // Shop nhận & thẩm định
        returnReceivedAt:     { type: Date },       // Thời điểm shop nhận hàng hoàn
        inspectionDeadline:   { type: Date },       // Hạn thẩm định hàng (returnReceivedAt + 3 ngày)
        inspectionStatus:     { type: String, default: 'pending' }, // 'pending' | 'passed' | 'failed'
        inspectionNote:       { type: String, default: '' },
        inspectionImages:     [{ type: String }],
        
        // Hoàn tiền
        refundDeadline:       { type: Date },       // Hạn hoàn tiền (3 ngày)
        refundedAt:           { type: Date },       // Thời điểm hoàn tiền thành công
        refundAmount:         { type: Number, default: 0 }
    },

    createdAt: { type: String, required: true }
}, { timestamps: true });

// Index cho tốc độ query
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ email: 1 });
OrderSchema.index({ createdAt: -1 });

const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);

module.exports = { OrderModel };
