/**
 * ============================================================
 * CONTROLLER: BÀI VIẾT (Article)
 * Tất cả route đi qua /api/admin/articles (POST/PUT/DELETE)
 * và /api/articles (GET public)
 *
 * ⭐ KHÔNG dùng middleware auth — admin route đã có auditMiddleware
 * ============================================================
 */
const Article = require('../models/Article');

// ──────────────────────────────────────────────────────────────
// GET /api/articles  hoặc  GET /api/admin/articles
// Lấy danh sách bài viết — PUBLIC
// ──────────────────────────────────────────────────────────────
exports.getArticles = async (req, res) => {
    try {
        const page   = parseInt(req.query.page,  10) || 1;
        const limit  = parseInt(req.query.limit, 10) || 20;
        const skip   = (page - 1) * limit;

        // Xây filter: admin xem tất cả, public chỉ xem published
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.category) filter.category = req.query.category;

        // Tìm kiếm theo title hoặc tag
        if (req.query.search) {
            filter.$or = [
                { title:   { $regex: req.query.search, $options: 'i' } },
                { tags:    { $in: [new RegExp(req.query.search, 'i')] } },
                { excerpt: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const [articles, total] = await Promise.all([
            Article.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Article.countDocuments(filter)
        ]);

        res.json({
            success:    true,
            count:      articles.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data:       articles
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ──────────────────────────────────────────────────────────────
// GET /api/articles/:id  — Xem chi tiết + tăng views
// ──────────────────────────────────────────────────────────────
exports.getArticle = async (req, res) => {
    try {
        const { id } = req.params;

        // Hỗ trợ tìm bằng MongoDB _id hoặc custom id hoặc slug
        let article =
            await Article.findById(id).catch(() => null) ||
            await Article.findOne({ id }) ||
            await Article.findOne({ slug: id });

        if (!article) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        }

        // Tăng lượt xem (fire & forget — không chặn response)
        Article.findByIdAndUpdate(article._id, { $inc: { views: 1 } }).catch(() => {});

        res.json({ success: true, data: article });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ──────────────────────────────────────────────────────────────
// POST /api/admin/articles  — Tạo bài viết mới
// ──────────────────────────────────────────────────────────────
exports.createArticle = async (req, res) => {
    try {
        const { title, content, slug, excerpt, thumbnail, category, status, tags } = req.body;

        // Validate bắt buộc
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề' });
        }
        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung' });
        }

        const article = await Article.create({
            title:     title.trim(),
            slug:      slug?.trim() || '',      // Nếu rỗng → middleware tự sinh
            excerpt:   excerpt?.trim() || '',
            content:   content.trim(),
            thumbnail: thumbnail?.trim() || '',
            category:  category || 'tin-tuc',
            status:    status || 'published',
            tags:      Array.isArray(tags) ? tags : []
        });

        res.status(201).json({ success: true, data: article });
    } catch (err) {
        // Slug hoặc id trùng
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Slug đã tồn tại, hãy đặt slug khác' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/admin/articles/:id  — Cập nhật bài viết
// ──────────────────────────────────────────────────────────────
exports.updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, slug, excerpt, thumbnail, category, status, tags } = req.body;

        // Tìm bài viết theo MongoDB _id hoặc custom id
        const existing = await Article.findById(id).catch(() => null)
                      || await Article.findOne({ id });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        }

        // Cập nhật từng trường (chỉ trường được gửi lên)
        if (title    !== undefined) existing.title     = title.trim();
        if (content  !== undefined) existing.content   = content.trim();
        if (slug     !== undefined) existing.slug      = slug.trim() || existing.slug;
        if (excerpt  !== undefined) existing.excerpt   = excerpt.trim();
        if (thumbnail!== undefined) existing.thumbnail = thumbnail.trim();
        if (category !== undefined) existing.category  = category;
        if (status   !== undefined) existing.status    = status;
        if (tags     !== undefined) existing.tags      = Array.isArray(tags) ? tags : [];

        await existing.save();

        res.json({ success: true, data: existing });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Slug đã tồn tại' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/admin/articles/:id  — Xóa bài viết
// ──────────────────────────────────────────────────────────────
exports.deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;

        const article = await Article.findByIdAndDelete(id).catch(() => null)
                     || await Article.findOneAndDelete({ id });

        if (!article) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        }

        res.json({ success: true, message: 'Đã xóa bài viết' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
