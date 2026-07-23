/**
 * ============================================================
 * MODEL: SỰ KIỆN ANALYTICS (AnalyticsEvent)
 * Mô tả: Ghi lại hành vi người dùng trên website để phân tích.
 *        Dùng cho admin dashboard thống kê traffic & hành vi mua hàng.
 *
 * Các loại event:
 *   - page_view       → Xem trang
 *   - product_view    → Xem chi tiết sản phẩm
 *   - add_to_cart     → Thêm vào giỏ
 *   - remove_from_cart → Xóa khỏi giỏ
 *   - begin_checkout  → Bắt đầu thanh toán
 *   - purchase        → Đặt hàng thành công
 *   - search          → Tìm kiếm sản phẩm
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AnalyticsEventSchema = new Schema({
    eventType: {
        type: String,
        required: true,
        enum: ['page_view', 'product_view', 'add_to_cart', 'remove_from_cart',
               'begin_checkout', 'purchase', 'search', 'wishlist_add', 'custom'],
        index: true
    },
    page:       { type: String },           // URL hoặc tên trang
    userId:     { type: String, default: null, index: true }, // Null nếu là khách vãng lai
    sessionId:  { type: String, index: true },               // Session ID
    metadata: {
        // Dữ liệu linh hoạt tùy theo loại event
        productId:    { type: String },     // ID sản phẩm (cho product_view, add_to_cart)
        productName:  { type: String },     // Tên sản phẩm
        category:     { type: String },     // Danh mục
        price:        { type: Number },     // Giá sản phẩm
        quantity:     { type: Number },     // Số lượng
        orderId:      { type: String },     // Mã đơn hàng (cho purchase)
        orderValue:   { type: Number },     // Giá trị đơn hàng
        searchQuery:  { type: String },     // Từ khóa tìm kiếm
        referrer:     { type: String },     // Trang nguồn
        device:       { type: String },     // Loại thiết bị: mobile/tablet/desktop
        userAgent:    { type: String },     // User agent
    }
}, { timestamps: true });

// Index để truy vấn nhanh theo khoảng thời gian
AnalyticsEventSchema.index({ createdAt: -1 });
AnalyticsEventSchema.index({ eventType: 1, createdAt: -1 });

const AnalyticsEventModel = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEventSchema);

module.exports = { AnalyticsEventModel };
