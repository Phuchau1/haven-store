/**
 * ============================================================
 * MODEL: AI JOB (Quản lý tiến trình xử lý AI Try-On bất đồng bộ)
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AIJobSchema = new Schema({
    jobId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: 'guest', index: true },
    status: { 
        type: String, 
        enum: ['pending', 'validating', 'segmenting', 'fitting', 'blending', 'completed', 'failed'],
        default: 'pending' 
    },
    progress: { type: Number, default: 0 },             // 0 - 100%
    currentStepMessage: { type: String, default: 'Khởi tạo tiến trình thử đồ...' },
    userImage: { type: String, required: true },
    productInfo: {
        id: { type: String },
        name: { type: String },
        image: { type: String },
        category: { type: String },
        color: { type: String },
        size: { type: String }
    },
    resultImage: { type: String, default: '' },
    aiAnalysisText: { type: String, default: '' },
    aiModel: { type: String, default: 'fashn' },
    errorMessage: { type: String, default: '' },
    validationWarnings: [{ type: String }],
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
}, { timestamps: true });

const AIJobModel = mongoose.models.AIJob || mongoose.model('AIJob', AIJobSchema);

module.exports = { AIJobModel };
