const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReviewSchema = new Schema({
    productId: { type: String, required: true },
    userId: { type: String }, 
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    isApproved: { type: Boolean, default: true } 
}, { timestamps: true });

const ReviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

module.exports = { ReviewModel };
