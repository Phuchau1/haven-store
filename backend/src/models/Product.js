const mongoose = require('mongoose');
const { Schema } = mongoose;

const ColorSchema = new Schema({
    name: { type: String, required: true },
    hex: { type: String, required: true },
    image: { type: String }
}, { _id: false });

const VariantSchema = new Schema({
    color: { type: String, required: true },
    size: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    price: { type: Number },
    originalPrice: { type: Number }
}, { _id: false });

const ProductSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    category: { type: String, required: true },
    categoryLabel: { type: String, required: true },
    category_id: { type: String }, // Liên kết bảng Category
    subCategory: { type: String }, // vd: 'quan-short', 'ao-thun'
    subCategoryLabel: { type: String }, // vd: 'Quần short', 'Áo thun'
    images: [{ type: String }],
    sizes: [{ type: String }],
    colors: [ColorSchema],
    variants: [VariantSchema],
    description: { type: String, default: '' },
    content: { type: String }, // Chi tiết nội dung sản phẩm
    instructions: [{ type: String }], // Hướng dẫn sử dụng
    notes: [{ type: String }], // Lưu ý nhỏ
    sizeChartImage: { type: String }, // Ảnh bảng size riêng của sản phẩm
    badge: { type: String },
    rating: { type: Number, required: true, default: 5 },
    reviews: { type: Number, required: true, default: 0 },
    inStock: { type: Boolean, required: true, default: true },
    soldQuantity: { type: Number, required: true, default: 0 }
}, { timestamps: true });

const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);

module.exports = { ProductModel };
