/**
 * ============================================================
 * MODEL: LỊCH SỬ THỬ ĐỒ AI (TryOnHistory)
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const TryOnHistorySchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userImage: { type: String, required: true },       // URL hoặc Base64 ảnh gốc
    resultImage: { type: String, required: true },     // URL hoặc Base64 ảnh thử đồ
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productImage: { type: String, required: true },
    category: { type: String, default: 'clothing' },
    selectedColor: { type: String, default: '' },
    selectedSize: { type: String, default: '' },
    aiModel: { type: String, default: 'fashn' },        // fashn, idm_vton, catvton, gemini, etc.
    processingTimeMs: { type: Number, default: 0 },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    feedback: { type: String, default: '' },            // Nhận xét thời trang từ AI
}, { timestamps: true });

const TryOnHistoryModel = mongoose.models.TryOnHistory || mongoose.model('TryOnHistory', TryOnHistorySchema);

module.exports = { TryOnHistoryModel };
