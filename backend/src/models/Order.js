/**
 * ============================================================
 * MODEL: ĐƠN HÀNG (Order)
 * Mô tả: Lưu trữ thông tin đơn hàng của khách hàng.
 * Bao gồm: thông tin người mua, danh sách sản phẩm, thanh toán,
 *           mã giảm giá, trạng thái đơn hàng và ghi chú.
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------- Sub-schema: Thông tin sản phẩm trong đơn hàng ---------- */
// Lưu snapshot thông tin sản phẩm tại thời điểm đặt hàng (tránh mất dữ liệu khi sản phẩm bị sửa/xóa)
const OrderItemProductSchema = new Schema({
    id:            { type: String, required: true },      // ID sản phẩm
    name:          { type: String, required: true },      // Tên sản phẩm
    price:         { type: Number, required: true },      // Giá bán tại thời điểm đặt hàng
    originalPrice: { type: Number },                      // Giá gốc (để hiển thị giảm giá)
    category:      { type: String },                      // Danh mục sản phẩm
    categoryLabel: { type: String },                      // Tên hiển thị danh mục
    images:        [{ type: String }],                    // Ảnh sản phẩm (lấy ảnh đầu tiên hiển thị)
    sizes:         [{ type: String }],                    // Các size của sản phẩm
    colors: [{
        name: { type: String },                           // Tên màu
        hex:  { type: String }                            // Mã màu HEX
    }],
    description:   { type: String },                      // Mô tả ngắn
    badge:         { type: String },                      // Nhãn (NEW, HOT, SALE...)
    rating:        { type: Number },                      // Điểm đánh giá
    reviews:       { type: Number },                      // Số lượt đánh giá
    inStock:       { type: Boolean }                      // Còn hàng hay không
}, { _id: false }); // Không tạo _id riêng cho sub-document

/* ---------- Sub-schema: Từng mục hàng trong đơn ---------- */
const OrderItemSchema = new Schema({
    product:       { type: OrderItemProductSchema, required: true }, // Thông tin sản phẩm
    quantity:      { type: Number, required: true, default: 1 },     // Số lượng mua
    selectedSize:  { type: String, required: true },                 // Kích thước đã chọn
    selectedColor: {
        name: { type: String, required: true },                      // Tên màu đã chọn
        hex:  { type: String, required: true }                       // Mã màu HEX đã chọn
    }
}, { _id: false });

/* ---------- Schema chính: Đơn hàng ---------- */
const OrderSchema = new Schema({
    id:              { type: String, required: true, unique: true },  // Mã đơn hàng duy nhất
    customerName:    { type: String, required: true },                // Tên người nhận hàng
    phone:           { type: String, required: true },                // Số điện thoại liên hệ
    email:           { type: String, required: true },                // Email người đặt hàng
    address:         { type: String, required: true },                // Địa chỉ giao hàng
    paymentMethod:   { type: String, required: true },                // Phương thức thanh toán (COD, MoMo, VNPay...)
    items:           [OrderItemSchema],                               // Danh sách sản phẩm trong đơn
    totalAmount:     { type: Number, required: true },                // Tổng tiền hàng (trước giảm giá)
    couponCode:      { type: String, default: '' },                   // Mã giảm giá đã áp dụng
    discountAmount:  { type: Number, default: 0 },                   // Số tiền được giảm
    finalAmount:     { type: Number, default: 0 },                   // Tổng tiền cuối cùng phải thanh toán
    note:            { type: String },                                // Ghi chú của khách hàng
    transferReceipt: { type: String, default: '' },                  // Ảnh biên lai chuyển khoản (nếu có)
    // Trạng thái đơn hàng theo luồng xử lý
    status: {
        type: String,
        required: true,
        enum: [
            'pending',           // Chờ xác nhận
            'processing',        // Đang xử lý / đóng gói
            'shipped',           // Đã giao cho đơn vị vận chuyển
            'delivered',         // Đã giao hàng thành công
            'cancelled',         // Đã hủy
            'refund_requested',  // Khách hàng yêu cầu hoàn tiền
            'refunded'           // Đã hoàn tiền
        ],
        default: 'pending'
    },
    createdAt: { type: String, required: true }                      // Thời gian tạo đơn (dạng String ISO)
}, { timestamps: true }); // Mongoose tự thêm createdAt, updatedAt dạng Date

/* ---------- Khởi tạo Model ---------- */
const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);

module.exports = { OrderModel };
