/**
 * ============================================================
 * MODEL: SẢN PHẨM (Product)
 * Mô tả: Định nghĩa cấu trúc dữ liệu cho sản phẩm trong cửa hàng.
 * Bao gồm: thông tin cơ bản, màu sắc, kích thước, biến thể và chỉ mục tìm kiếm.
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------- Sub-schema: Màu sắc sản phẩm ---------- */
const ColorSchema = new Schema({
    name: { type: String, required: true },  // Tên màu (vd: 'Đen', 'Trắng')
    hex:  { type: String, required: true },  // Mã màu HEX (vd: '#000000')
    image: { type: String }                  // Ảnh đại diện cho màu này (tùy chọn)
}, { _id: false }); // Không tạo _id riêng cho sub-document

/* ---------- Sub-schema: Biến thể sản phẩm (Màu + Size + Tồn kho) ---------- */
const VariantSchema = new Schema({
    color:         { type: String, required: true },       // Tên màu của biến thể
    size:          { type: String, required: true },       // Kích thước của biến thể (S, M, L, XL...)
    stock:         { type: Number, required: true, default: 0 }, // Số lượng tồn kho
    price:         { type: Number },                       // Giá riêng của biến thể (ghi đè giá gốc)
    originalPrice: { type: Number }                        // Giá gốc riêng của biến thể (để hiển thị giảm giá)
}, { _id: false });

/* ---------- Schema chính: Sản phẩm ---------- */
const ProductSchema = new Schema({
    id:               { type: String, required: true, unique: true }, // ID tùy chỉnh (dạng slug hoặc mã)
    name:             { type: String, required: true },               // Tên sản phẩm
    price:            { type: Number, required: true },               // Giá bán hiện tại
    originalPrice:    { type: Number },                               // Giá gốc (để hiển thị giảm giá)
    category:         { type: String, required: true },               // Mã danh mục (vd: 'cat-clothing')
    categoryLabel:    { type: String, required: true },               // Tên hiển thị danh mục (vd: 'Quần áo')
    category_id:      { type: String },                               // Liên kết với bảng Category (ObjectId dạng String)
    subCategory:      { type: String },                               // Mã danh mục con (vd: 'quan-short', 'ao-thun')
    subCategoryLabel: { type: String },                               // Tên hiển thị danh mục con
    images:           [{ type: String }],                             // Danh sách URL hình ảnh sản phẩm
    sizes:            [{ type: String }],                             // Danh sách kích thước có sẵn
    colors:           [ColorSchema],                                  // Danh sách màu sắc (dùng sub-schema ColorSchema)
    variants:         [VariantSchema],                                // Danh sách biến thể (màu + size + tồn kho)
    description:      { type: String, default: '' },                  // Mô tả ngắn sản phẩm (cũ)
    content:          { type: String },                               // Nội dung chi tiết sản phẩm (cũ)
    
    // --- NEW FIELDS FOR DETAILED DESCRIPTION ---
    shortDescription: { type: String, default: '' },                  // Mô tả ngắn (150-250 ký tự)
    richContent:      { type: String, default: '' },                  // Nội dung HTML từ Rich Text Editor
    specifications:   { type: Object, default: {} },                  // Thông số kỹ thuật (chất liệu, co giãn, kiểu cổ...)
    sizeGuide:        [{ type: Object }],                             // Bảng hướng dẫn size (size, vai, ngực, dài...)
    careInstructions: [{ type: String }],                             // Hướng dẫn bảo quản
    features:         [{ type: String }],                             // Đặc điểm nổi bật
    tags:             [{ type: String }],                             // Từ khóa tag
    seo:              { type: Object, default: { title: '', description: '', keywords: '', slug: '' } }, // SEO Meta
    faqs:             [{ 
        question: { type: String },
        answer: { type: String }
    }],                                                               // Câu hỏi thường gặp
    certificates:     [{ type: String }],                             // Chứng nhận
    fabric:           [{ type: String }],                             // Thành phần vải %
    status:           { type: String, enum: ['draft', 'published', 'scheduled'], default: 'published' }, // Trạng thái
    publishAt:        { type: Date },                                 // Ngày lên lịch xuất bản
    videos:           [{ type: String }],                             // URL video
    
    instructions:     [{ type: String }],                             // Hướng dẫn sử dụng / bảo quản (cũ)
    notes:            [{ type: String }],                             // Lưu ý đặc biệt
    sizeChartImage:   { type: String },                               // URL ảnh bảng hướng dẫn chọn size
    badge:            { type: String },                               // Nhãn nổi bật (vd: 'NEW', 'HOT', 'SALE')
    rating:           { type: Number, required: true, default: 5 },  // Điểm đánh giá trung bình (1-5)
    reviews:          { type: Number, required: true, default: 0 },  // Tổng số lượt đánh giá
    inStock:          { type: Boolean, required: true, default: true }, // Trạng thái còn hàng
    soldQuantity:     { type: Number, required: true, default: 0 }   // Tổng số lượng đã bán
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

/* ---------- Chỉ mục (Index) tối ưu tốc độ truy vấn ---------- */
ProductSchema.index({ name: 'text', description: 'text' }); // Cho phép tìm kiếm full-text theo tên và mô tả
ProductSchema.index({ category: 1, price: 1 });              // Tối ưu lọc theo danh mục + khoảng giá
ProductSchema.index({ createdAt: -1 });                      // Tối ưu sắp xếp theo ngày mới nhất

/* ---------- Khởi tạo Model (tránh tạo lại khi hot-reload) ---------- */
const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);

module.exports = { ProductModel };
