/**
 * ============================================================
 * CONTROLLER: AI VIRTUAL TRY-ON
 * Flow: Tạo Job → Chạy ngầm → Polling trạng thái
 * ============================================================
 */
const { AIJobModel }        = require('../models/AIJob');
const { TryOnHistoryModel } = require('../models/TryOnHistory');
const { AITryOnEngine }     = require('../services/aiTryOnEngine');
const logger                = require('../utils/logger');

// ─────────────────────────────────────────────────────────────
// @route POST /api/tryon/validate-image
// @desc  Kiểm tra sơ bộ ảnh trước khi gửi lên AI
// ─────────────────────────────────────────────────────────────
exports.validateImageQuality = async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) {
            return res.status(400).json({ success: false, message: 'Chưa cung cấp ảnh.' });
        }

        const warnings = [];
        const sizeBytes = Math.round((imageBase64.length * 3) / 4);
        if (sizeBytes > 20 * 1024 * 1024) warnings.push('Ảnh vượt 20MB, vui lòng nén lại.');
        if (sizeBytes < 10 * 1024)        warnings.push('Ảnh quá nhỏ, chất lượng thấp.');

        return res.json({
            success: true,
            isValid:     warnings.length === 0,
            warnings,
            suggestions: [
                'Đứng thẳng, chụp toàn thân hoặc từ thắt lưng trở lên',
                'Đảm bảo đủ ánh sáng, không bị ngược sáng',
                'Nền đơn giản (trắng hoặc một màu) cho kết quả tốt nhất',
                'Không mặc quần áo quá rộng hoặc trang phục cồng kềnh'
            ]
        });
    } catch (err) {
        logger.error('validateImage error: ' + err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────
// @route POST /api/tryon/generate-job
// @desc  Tạo AI Try-On Job và chạy bất đồng bộ
// ─────────────────────────────────────────────────────────────
exports.createTryOnJob = async (req, res) => {
    try {
        const {
            userImageBase64,
            productId, productName, productImage,
            category, selectedColor, selectedSize,
            userId
        } = req.body;

        if (!userImageBase64) return res.status(400).json({ success: false, message: 'Thiếu ảnh người dùng.' });
        if (!productId)       return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm.' });
        if (!productImage)    return res.status(400).json({ success: false, message: 'Sản phẩm chưa có ảnh.' });

        const jobId = `tryon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        // Tạo Job record ban đầu
        await AIJobModel.create({
            jobId,
            userId:   userId || 'guest',
            status:   'pending',
            progress: 5,
            currentStepMessage: 'Đang khởi tạo job thử đồ AI...',
            userImage: userImageBase64,
            productInfo: {
                id:       productId,
                name:     productName,
                image:    productImage,
                category: category || 'tops',
                color:    selectedColor,
                size:     selectedSize
            },
            aiModel: process.env.REPLICATE_API_TOKEN ? 'replicate_idm_vton' : 'mock'
        });

        // Phản hồi ngay, không chờ AI xử lý
        res.json({ success: true, jobId, message: 'Job đã được tạo, đang xử lý...' });

        // Chạy AI ngầm (không await)
        runTryOnBackground(jobId, userImageBase64, {
            id:       productId,
            name:     productName,
            image:    productImage,
            category: category || 'tops',
            color:    selectedColor,
            size:     selectedSize
        }, userId).catch(err => {
            logger.error(`[TryOn] Job ${jobId} background error: ${err.message}`);
        });

    } catch (err) {
        logger.error('createTryOnJob error: ' + err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────
// Background processor — chạy các bước AI tuần tự
// ─────────────────────────────────────────────────────────────
async function runTryOnBackground(jobId, userImageBase64, productInfo, userId) {
    const update = (fields) => AIJobModel.findOneAndUpdate({ jobId }, fields);

    try {
        // ── Bước 1: Đang chuẩn bị ảnh (15%)
        await new Promise(r => setTimeout(r, 800));
        await update({ status: 'preparing', progress: 15, currentStepMessage: 'Đang chuẩn bị và tối ưu ảnh...' });

        // ── Bước 2: Upload ảnh người lên Cloudinary (30%)
        await new Promise(r => setTimeout(r, 600));
        await update({ status: 'uploading', progress: 30, currentStepMessage: 'Đang upload ảnh lên cloud storage...' });

        // ── Bước 3: Gửi đến AI (50%)
        await new Promise(r => setTimeout(r, 400));
        await update({ status: 'processing', progress: 50, currentStepMessage: 'AI đang phân tích dáng người & trang phục...' });

        // ── Bước 4: AI đang render (75%) — Engine thực sự bắt đầu ở đây
        const enginePromise = AITryOnEngine.executeTryOn({
            userImageBase64,
            garmentImageUrl: productInfo.image,
            productInfo
        });

        // Cập nhật UI trong lúc AI đang chạy
        await new Promise(r => setTimeout(r, 3000));
        await update({ status: 'rendering', progress: 75, currentStepMessage: 'AI đang ghép trang phục, điều chỉnh nếp vải & ánh sáng...' });

        // Chờ kết quả thực sự từ engine
        const engineResult = await enginePromise;

        // ── Bước 5: Hoàn thành (100%)
        const finalJob = await AIJobModel.findOneAndUpdate(
            { jobId },
            {
                status:             'completed',
                progress:           100,
                currentStepMessage: 'Thử đồ AI thành công! ✨',
                resultImage:        engineResult.resultImage,
                aiAnalysisText:     engineResult.analysisText || '',
                completedAt:        new Date()
            },
            { new: true }
        );

        logger.info(`[TryOn] ✅ Job ${jobId} hoàn thành | model=${engineResult.aiModelUsed} | time=${engineResult.processingTimeMs}ms`);

        // Lưu lịch sử (chỉ với user đã đăng nhập)
        if (userId && userId !== 'guest' && finalJob) {
            await TryOnHistoryModel.create({
                id:              `hist-${Date.now()}`,
                userId,
                userImage:       userImageBase64,
                resultImage:     finalJob.resultImage,
                productId:       productInfo.id,
                productName:     productInfo.name,
                productImage:    productInfo.image,
                category:        productInfo.category,
                selectedColor:   productInfo.color,
                selectedSize:    productInfo.size,
                aiModel:         engineResult.aiModelUsed,
                processingTimeMs: engineResult.processingTimeMs,
                feedback:        engineResult.analysisText || ''
            }).catch(e => logger.warn('Lưu lịch sử thất bại: ' + e.message));
        }

    } catch (err) {
        logger.error(`[TryOn] ❌ Job ${jobId} thất bại: ${err.message}`);
        await AIJobModel.findOneAndUpdate({ jobId }, {
            status:             'failed',
            progress:           100,
            currentStepMessage: 'Xử lý AI gặp lỗi. Vui lòng thử lại.',
            errorMessage:       err.message
        });
    }
}

// ─────────────────────────────────────────────────────────────
// @route GET /api/tryon/job-status/:jobId
// @desc  Polling trạng thái job
// ─────────────────────────────────────────────────────────────
exports.getJobStatus = async (req, res) => {
    try {
        const job = await AIJobModel.findOne({ jobId: req.params.jobId }).lean();
        if (!job) return res.status(404).json({ success: false, message: 'Không tìm thấy job.' });
        res.json({ success: true, job });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────
// @route GET /api/tryon/history
// @desc  Lịch sử thử đồ của user
// ─────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
        const history = await TryOnHistoryModel.find({ userId }).sort({ createdAt: -1 }).limit(30).lean();
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────
// @route DELETE /api/tryon/history/:id
// ─────────────────────────────────────────────────────────────
exports.deleteHistory = async (req, res) => {
    try {
        await TryOnHistoryModel.deleteOne({ id: req.params.id });
        res.json({ success: true, message: 'Đã xóa.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────
// @route GET /api/tryon/admin/analytics
// ─────────────────────────────────────────────────────────────
exports.getAdminAnalytics = async (req, res) => {
    try {
        const [total, success, failed] = await Promise.all([
            AIJobModel.countDocuments(),
            AIJobModel.countDocuments({ status: 'completed' }),
            AIJobModel.countDocuments({ status: 'failed' })
        ]);
        const topProducts = await TryOnHistoryModel.aggregate([
            { $group: { _id: '$productId', productName: { $first: '$productName' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        res.json({
            success: true,
            analytics: {
                totalJobs: total, successJobs: success, failedJobs: failed,
                successRate: total > 0 ? ((success / total) * 100).toFixed(1) + '%' : '100%',
                activeModel: process.env.REPLICATE_API_TOKEN ? 'Replicate IDM-VTON' : 'Mock',
                topProducts
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
