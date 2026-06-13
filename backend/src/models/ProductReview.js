const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductReviewSchema = new Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    userName: { type: String, required: true, default: 'Khách hàng' },
    userEmail: { type: String },
    product_id: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    status: { type: String, required: true, default: 'approved' },
    created_at: { type: String, required: true, default: () => new Date().toISOString() }
}, { timestamps: true });

const ProductReviewModel = mongoose.models.ProductReview || mongoose.model('ProductReview', ProductReviewSchema);

module.exports = { ProductReviewModel };
