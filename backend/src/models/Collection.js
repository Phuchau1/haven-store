/**
 * ============================================================
 * MODEL: BỘ SƯU TẬP (Collection)
 * Mô tả: Quản lý bộ sưu tập theo mùa/chủ đề (Summer 2026, Limited, New Arrival...)
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CollectionSchema = new Schema({
    name:        { type: String, required: true },               // Tên bộ sưu tập (vd: Summer 2026)
    slug:        { type: String, required: true, unique: true }, // Đường dẫn slug SEO
    banner:      { type: String },                               // URL banner bộ sưu tập
    description: { type: String, default: '' },                  // Mô tả chi tiết
    productIds:  [{ type: String }],                             // Danh sách ID sản phẩm thuộc BST
    isFeatured:  { type: Boolean, default: false },              // Hiển thị nổi bật trên trang chủ
    status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
    startDate:   { type: Date },                                 // Ngày bắt đầu
    endDate:     { type: Date }                                  // Ngày kết thúc
}, { timestamps: true });

const CollectionModel = mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);

module.exports = { CollectionModel };
