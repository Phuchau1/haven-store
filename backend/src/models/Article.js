/**
 * ============================================================
 * MODEL: BÀI VIẾT (Article)
 * Collection MongoDB: articles
 * ============================================================
 */
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    // ID tùy chỉnh (dạng string, dùng nhất quán với các model khác trong dự án)
    id: {
        type: String,
        unique: true,
        sparse: true
    },
    title: {
        type: String,
        required: [true, 'Vui lòng nhập tiêu đề'],
        trim: true
    },
    // ⭐ Slug: URL thân thiện — tự sinh từ title nếu để trống
    slug: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true
    },
    // Tóm tắt ngắn hiển thị ở trang danh sách
    excerpt: {
        type: String,
        default: '',
        trim: true
    },
    // Nội dung đầy đủ — hỗ trợ HTML
    content: {
        type: String,
        required: [true, 'Vui lòng nhập nội dung']
    },
    // URL ảnh đại diện
    thumbnail: {
        type: String,
        default: ''
    },
    // Danh mục
    category: {
        type: String,
        enum: ['xu-huong', 'tips', 'tin-tuc', 'phong-cach', 'khac'],
        default: 'tin-tuc'
    },
    // ⭐ Trạng thái: published = công khai, draft = bản nháp
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    },
    // Tags để tìm kiếm và lọc
    tags: {
        type: [String],
        default: []
    },
    // Lượt xem — tự tăng khi xem chi tiết
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // Tự thêm createdAt, updatedAt
});

// ─── Tự sinh id và slug trước khi lưu ───────────────────────
articleSchema.pre('save', function (next) {
    // Sinh id tùy chỉnh nếu chưa có
    if (!this.id) {
        this.id = 'article-' + Date.now().toString(36);
    }

    // Sinh slug từ title nếu chưa có
    if (!this.slug && this.title) {
        this.slug = makeSlug(this.title) + '-' + Date.now().toString().slice(-5);
    }

    // Tự sinh excerpt từ content nếu chưa điền
    if (!this.excerpt && this.content) {
        const plain = this.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        this.excerpt = plain.slice(0, 160) + (plain.length > 160 ? '...' : '');
    }

    next();
});

// ─── Hàm tạo slug chuẩn tiếng Việt ─────────────────────────
function makeSlug(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// Index tăng tốc tìm kiếm
articleSchema.index({ status: 1, createdAt: -1 });
articleSchema.index({ category: 1 });
articleSchema.index({ tags: 1 });

module.exports = mongoose.model('Article', articleSchema);
