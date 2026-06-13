/**
 * Seed script: Tạo dữ liệu danh mục mẫu vào MongoDB
 * Chạy: node backend/src/scripts/seedCategories.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ Thiếu MONGODB_URI trong file .env');
    process.exit(1);
}

// ─── Schema (inline) ──────────────────────────────────────────────────────────
const SubCategorySchema = new mongoose.Schema({
    id: String,
    name: String,
    slug: String,
    description: String,
    image: String,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: String,
    description: String,
    image: String,
    count: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    subcategories: [SubCategorySchema],
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

// ─── Data ─────────────────────────────────────────────────────────────────────
const SEED_CATEGORIES = [
    {
        id: 'ao-nam',
        name: 'Áo nam',
        description: 'Bộ sưu tập áo nam đa dạng phong cách',
        image: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=80',
        count: 0,
        order: 0,
        isActive: true,
        subcategories: [
            { id: 'ao-polo',     name: 'Áo Polo',       order: 0, isActive: true },
            { id: 'ao-thun',     name: 'Áo Thun',       order: 1, isActive: true },
            { id: 'ao-so-mi',    name: 'Áo Sơ Mi',      order: 2, isActive: true },
            { id: 'ao-quan-ni',  name: 'Áo - Quần Nỉ',  order: 3, isActive: true },
            { id: 'ao-blazer',   name: 'Áo Blazer',     order: 4, isActive: true },
            { id: 'ao-len',      name: 'Áo Len',        order: 5, isActive: true },
            { id: 'ao-khoac',    name: 'Áo Khoác',      order: 6, isActive: true },
        ],
    },
    {
        id: 'quan-nam',
        name: 'Quần nam',
        description: 'Đa dạng kiểu dáng quần nam thời trang',
        image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80',
        count: 0,
        order: 1,
        isActive: true,
        subcategories: [
            { id: 'quan-short',     name: 'Quần Short',     order: 0, isActive: true },
            { id: 'quan-dai-kaki',  name: 'Quần Dài Kaki',  order: 1, isActive: true },
            { id: 'quan-jeans',     name: 'Quần Jeans',     order: 2, isActive: true },
            { id: 'quan-au',        name: 'Quần Âu',        order: 3, isActive: true },
            { id: 'quan-gio',       name: 'Quần Gió',       order: 4, isActive: true },
        ],
    },
    {
        id: 'phu-kien',
        name: 'Phụ kiện',
        description: 'Phụ kiện thời trang nam nữ',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
        count: 0,
        order: 2,
        isActive: true,
        subcategories: [
            { id: 'that-lung',  name: 'Thắt lưng', order: 0, isActive: true },
            { id: 'non',        name: 'Nón/Mũ',    order: 1, isActive: true },
            { id: 'tui-xach',   name: 'Túi xách',  order: 2, isActive: true },
        ],
    },
];

// ─── Run ──────────────────────────────────────────────────────────────────────
async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    let created = 0, updated = 0;

    for (const catData of SEED_CATEGORIES) {
        const existing = await Category.findOne({ id: catData.id });
        if (existing) {
            await Category.findOneAndUpdate({ id: catData.id }, catData, { new: true });
            console.log(`🔄 Cập nhật: ${catData.name}`);
            updated++;
        } else {
            await new Category(catData).save();
            console.log(`➕ Tạo mới: ${catData.name}`);
            created++;
        }
    }

    console.log(`\n🎉 Hoàn tất! Tạo mới: ${created}, Cập nhật: ${updated}`);
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Lỗi seed:', err.message);
    process.exit(1);
});
