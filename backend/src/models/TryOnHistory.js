const mongoose = require('mongoose');
const { Schema } = mongoose;

const TryOnHistorySchema = new Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    garmentImage: { type: String, required: true },
    userImage: { type: String, required: true },
    resultImage: { type: String, required: true },
    selectedColor: { type: String, default: '' },
    selectedSize: { type: String, default: '' },
    status: { type: String, enum: ['completed', 'failed'], default: 'completed' },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

TryOnHistorySchema.index({ userId: 1, createdAt: -1 });

const TryOnHistoryModel = mongoose.models.TryOnHistory || mongoose.model('TryOnHistory', TryOnHistorySchema);

module.exports = { TryOnHistoryModel };
