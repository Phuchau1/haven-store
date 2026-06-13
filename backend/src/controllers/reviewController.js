/**
 * reviewController.js
 * Controller xử lý toàn bộ logic đánh giá sản phẩm (ProductReview)
 * - Lưu vĩnh viễn vào MongoDB
 * - Tự động cập nhật rating trung bình của sản phẩm
 * - Validation đầy đủ
 */

const { ProductReviewModel } = require('../models/ProductReview');
const { ProductModel } = require('../models/Product');
const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(
        path.join(process.cwd(), 'backend_debug.log'),
        `[${timestamp}] [ReviewController] ${msg}\n`
    );
    console.log(`[ReviewController] ${msg}`);
}

/**
 * Tính lại rating trung bình và cập nhật vào Product
 */
async function recalcProductRating(product_id) {
    const approvedReviews = await ProductReviewModel.find({ product_id, status: 'approved' });
    const count = approvedReviews.length;
    const avg = count > 0
        ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;

    await ProductModel.findOneAndUpdate(
        { id: product_id },
        {
            rating: Math.round(avg * 10) / 10,
            reviews: count
        }
    );

    return { avg: Math.round(avg * 10) / 10, count };
}

// ─── GET /api/reviews?product_id=xxx ─────────────────────────────────────────
const getReviewsByProduct = async (req, res, next) => {
    try {
        const { product_id } = req.query;
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu product_id' });
        }

        const reviews = await ProductReviewModel
            .find({ product_id, status: 'approved' })
            .sort({ createdAt: -1 });

        return res.json({ success: true, reviews, total: reviews.length });
    } catch (error) {
        log(`getReviewsByProduct error: ${error.message}`);
        next(error);
    }
};

// ─── POST /api/reviews ────────────────────────────────────────────────────────
const createReview = async (req, res, next) => {
    try {
        const { product_id, rating, content, userName, userEmail, user_id } = req.body;

        // Validation
        if (!product_id || !rating || !content) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ: product_id, rating và nội dung đánh giá'
            });
        }

        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating phải là số từ 1 đến 5'
            });
        }

        const trimmedContent = String(content).trim();
        if (trimmedContent.length < 5) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung đánh giá phải có ít nhất 5 ký tự'
            });
        }

        if (trimmedContent.length > 2000) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung đánh giá không được vượt quá 2000 ký tự'
            });
        }

        // Kiểm tra sản phẩm có tồn tại không
        const product = await ProductModel.findOne({ id: product_id });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không tồn tại'
            });
        }

        // Tạo đánh giá mới
        const reviewId = `rv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const newReview = new ProductReviewModel({
            id: reviewId,
            user_id: user_id || 'guest',
            userName: (userName || 'Khách hàng').trim(),
            userEmail: userEmail || '',
            product_id,
            rating: ratingNum,
            content: trimmedContent,
            status: 'approved',   // Tự động duyệt — đổi thành 'pending' nếu muốn kiểm duyệt trước
            created_at: new Date().toISOString()
        });

        // LƯU VĨNH VIỄN VÀO MONGODB
        await newReview.save();
        log(`✅ Review saved to MongoDB: ${reviewId} | product: ${product_id} | rating: ${ratingNum}⭐`);

        // Cập nhật rating trung bình của sản phẩm
        const { avg, count } = await recalcProductRating(product_id);
        log(`📊 Product ${product_id} rating updated: ${avg}⭐ (${count} reviews)`);

        return res.status(201).json({
            success: true,
            message: 'Đánh giá đã được lưu thành công!',
            review: newReview.toObject(),
            productRating: { avg, count }
        });
    } catch (error) {
        log(`createReview error: ${error.message}`);
        next(error);
    }
};

// ─── GET /api/reviews/all (Admin only) ───────────────────────────────────────
const getAllReviews = async (req, res, next) => {
    try {
        const { status, product_id, page = 1, limit = 50 } = req.query;
        const query = {};
        if (status && status !== 'all') query.status = status;
        if (product_id) query.product_id = product_id;

        const skip = (Number(page) - 1) * Number(limit);
        const [reviews, total] = await Promise.all([
            ProductReviewModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            ProductReviewModel.countDocuments(query)
        ]);

        // Bổ sung tên sản phẩm
        const productIds = [...new Set(reviews.map(r => r.product_id))];
        const products = await ProductModel.find({ id: { $in: productIds } }).select('id name');
        const productMap = products.reduce((acc, p) => {
            acc[p.id] = p.name;
            return acc;
        }, {});

        const enriched = reviews.map(r => ({
            ...r.toObject(),
            productName: productMap[r.product_id] || 'Sản phẩm không xác định'
        }));

        return res.json({
            success: true,
            reviews: enriched,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });
    } catch (error) {
        log(`getAllReviews error: ${error.message}`);
        next(error);
    }
};

// ─── PUT /api/reviews/status ──────────────────────────────────────────────────
const updateReviewStatus = async (req, res, next) => {
    try {
        const { id, status } = req.body;
        if (!id || !['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
        }

        const review = await ProductReviewModel.findOneAndUpdate({ id }, { status }, { new: true });
        if (!review) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
        }

        const { avg, count } = await recalcProductRating(review.product_id);
        log(`Status updated: ${id} → ${status} | product rating: ${avg}⭐ (${count})`);

        return res.json({
            success: true,
            message: 'Cập nhật trạng thái thành công',
            review,
            productRating: { avg, count }
        });
    } catch (error) {
        log(`updateReviewStatus error: ${error.message}`);
        next(error);
    }
};

// ─── DELETE /api/reviews?id=xxx ───────────────────────────────────────────────
const deleteReview = async (req, res, next) => {
    try {
        const id = typeof req.query.id === 'string' ? req.query.id.trim() : undefined;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID đánh giá' });
        }

        const deleted = await ProductReviewModel.findOneAndDelete({ id });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
        }

        const { avg, count } = await recalcProductRating(deleted.product_id);
        log(`Deleted review: ${id} | product rating recalculated: ${avg}⭐ (${count})`);

        return res.json({
            success: true,
            message: 'Xóa đánh giá thành công',
            productRating: { avg, count }
        });
    } catch (error) {
        log(`deleteReview error: ${error.message}`);
        next(error);
    }
};

module.exports = {
    getReviewsByProduct,
    createReview,
    getAllReviews,
    updateReviewStatus,
    deleteReview,
    recalcProductRating
};
