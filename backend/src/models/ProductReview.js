const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductReviewSchema = new Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    userName: { type: String, required: true, default: 'Khách hàng' },
    product_id: { type: String, required: true },
    orderId: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    sellerRating: { type: Number, min: 1, max: 5, default: 5 },
    shippingRating: { type: Number, min: 1, max: 5, default: 5 },
    tags: [{ type: String }],
    content: { type: String, required: true },
    reply: { type: String, default: '' },
    replyCreatedAt: { type: String },
    status: { type: String, required: true, default: 'approved' },
    created_at: { type: String, required: true, default: () => new Date().toISOString() }
}, { timestamps: true });

// ─── INDEX ────────────────────────────────────────────────────────────────────
// Compound unique index: Mỗi user chỉ được đánh giá mỗi sản phẩm 1 lần (enforce at DB level)
ProductReviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true, sparse: true });
// Index cho tốc độ query theo sản phẩm
ProductReviewSchema.index({ product_id: 1, status: 1 });

const ProductReviewModel = mongoose.models.ProductReview || mongoose.model('ProductReview', ProductReviewSchema);

module.exports = { ProductReviewModel };
