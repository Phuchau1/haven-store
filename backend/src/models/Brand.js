/**
 * ============================================================
 * MODEL: THƯƠNG HIỆU (Brand)
 * Mô tả: Quản lý thương hiệu nhà sản xuất (Nike, Adidas, Routine, HAVEN...)
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const BrandSchema = new Schema({
    name:        { type: String, required: true, unique: true }, // Tên thương hiệu
    slug:        { type: String, required: true, unique: true }, // Đường dẫn SEO
    logo:        { type: String },                               // URL logo thương hiệu
    description: { type: String, default: '' },                  // Mô tả thương hiệu
    country:     { type: String, default: 'Việt Nam' },          // Quốc gia xuất xứ
    isActive:    { type: Boolean, default: true },               // Trạng thái kích hoạt
    order:       { type: Number, default: 0 }                    // Thứ tự sắp xếp
}, { timestamps: true });

const BrandModel = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);

module.exports = { BrandModel };
