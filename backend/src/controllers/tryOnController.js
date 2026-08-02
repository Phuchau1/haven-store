/**
 * ============================================================
 * CONTROLLER: AI VIRTUAL TRY-ON
 * Engine: Replicate IDM-VTON (yisol/idm-vton)
 * Fallback: Canvas composite (client-side)
 * ============================================================
 */

const axios  = require('axios');
const logger = require('../utils/logger');

// ─── In-memory job store (auto-cleanup sau 30 phút) ─────────
const jobsStore = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobsStore.entries()) {
        if (now - job.createdAt > 30 * 60 * 1000) jobsStore.delete(id);
    }
}, 5 * 60 * 1000);

// ─── Helpers ─────────────────────────────────────────────────

function mapCategory(cat = '') {
    const c = cat.toLowerCase();
    if (['quan','pants','jeans','shorts','skirt','bottoms','lower'].some(k => c.includes(k))) return 'lower_body';
    if (['dress','vay','dam','one-piece','jumpsuit'].some(k => c.includes(k))) return 'dresses';
    return 'upper_body';
}

/** Convert URL to base64 data URL */
async function urlToBase64(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    const mime = res.headers['content-type'] || 'image/png';
    return `data:${mime};base64,${Buffer.from(res.data).toString('base64')}`;
}

/** Upload base64 image to ImgBB → get public HTTPS URL */
async function uploadBase64ToImgBB(base64DataUrl) {
    const clean = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
    const form  = new URLSearchParams();
    form.append('image', clean);
    form.append('key',   '6d207e02198a847aa98d0a2a901485a5');

    const res = await axios.post('https://api.imgbb.com/1/upload', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 20000
    });
    const url = res.data?.data?.url;
    if (!url) throw new Error('ImgBB upload failed: no URL returned');
    return url.replace(/^http:/, 'https:');
}

// ─── Replicate IDM-VTON ───────────────────────────────────────

async function runReplicateIDMVTON(personBase64, garmentUrl, category) {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error('REPLICATE_API_TOKEN not configured');

    logger.info('[TryOn] Uploading person image to ImgBB...');
    const personUrl = await uploadBase64ToImgBB(personBase64);
    logger.info(`[TryOn] Person URL: ${personUrl}`);

    const garmentSecure = garmentUrl.replace(/^http:/, 'https:');

    // ── Tạo prediction ──────────────────────────────────────
    logger.info('[TryOn] Creating Replicate IDM-VTON prediction...');
    const createRes = await axios.post(
        'https://api.replicate.com/v1/models/yisol/idm-vton/predictions',
        {
            input: {
                human_img:       personUrl,
                garm_img:        garmentSecure,
                garment_des:     'fashion clothing item',
                category:        mapCategory(category),
                is_checked:      true,
                is_checked_crop: false,
                denoise_steps:   30,
                seed:            42
            }
        },
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type':  'application/json',
                'Prefer':        'wait'   // synchronous wait nếu model nhanh
            },
            timeout: 120000
        }
    );

    const predId = createRes.data?.id;
    if (!predId) throw new Error('No prediction ID from Replicate');
    logger.info(`[TryOn] Prediction ID: ${predId} — polling...`);

    // ── Poll kết quả (tối đa 3 phút) ───────────────────────
    const MAX_POLLS = 36; // 36 × 5s = 3 phút
    for (let i = 1; i <= MAX_POLLS; i++) {
        await new Promise(r => setTimeout(r, 5000));

        const poll = await axios.get(
            `https://api.replicate.com/v1/predictions/${predId}`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 15000
            }
        );

        const { status, output, error: rErr, logs } = poll.data;
        logger.info(`[TryOn] Poll ${i}/${MAX_POLLS} → status: ${status}`);

        if (status === 'succeeded') {
            const outputUrl = Array.isArray(output) ? output[0] : output;
            if (!outputUrl) throw new Error('Replicate returned empty output');
            logger.info(`[TryOn] ✅ IDM-VTON succeeded: ${outputUrl}`);
            return await urlToBase64(outputUrl);
        }

        if (status === 'failed' || status === 'canceled') {
            throw new Error(`Replicate ${status}: ${rErr || 'unknown error'}`);
        }
    }

    throw new Error('Replicate timeout after 3 minutes');
}

// ─── ENDPOINT: Tạo job thử đồ ────────────────────────────────

exports.runTryOn = async (req, res) => {
    const { userImageBase64, garmentImageUrl, category } = req.body;

    if (!userImageBase64 || !garmentImageUrl) {
        return res.status(400).json({ success: false, message: 'Thiếu ảnh người dùng hoặc ảnh sản phẩm.' });
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    jobsStore.set(jobId, {
        jobId,
        status:    'processing',
        progress:  5,
        message:   '🚀 Đang khởi động IDM-VTON AI...',
        resultImage: null,
        requireComposite: false,
        userImage:   userImageBase64,
        garmentUrl:  garmentImageUrl,
        category:    category || 'upper_body',
        createdAt:   Date.now()
    });

    // Trả về ngay lập tức
    res.json({ success: true, jobId });

    // Xử lý ngầm
    _processJob(jobId, userImageBase64, garmentImageUrl, category).catch(err => {
        logger.error(`[TryOn] Unhandled job error: ${err.message}`);
    });
};

// ─── Xử lý ngầm ──────────────────────────────────────────────

async function _processJob(jobId, userImageBase64, garmentImageUrl, category) {
    const update = (data) => {
        const j = jobsStore.get(jobId);
        if (j) jobsStore.set(jobId, { ...j, ...data });
    };

    // ── Thử Replicate IDM-VTON ──────────────────────────────
    try {
        update({ progress: 20, message: '🤖 IDM-VTON đang phân tích ảnh người...' });
        await new Promise(r => setTimeout(r, 2000)); // brief delay for UX

        update({ progress: 40, message: '👗 Đang ghép trang phục lên cơ thể...' });
        const result = await runReplicateIDMVTON(userImageBase64, garmentImageUrl, category);

        update({
            status:      'completed',
            progress:    100,
            message:     '✨ AI thử đồ thành công!',
            resultImage: result,
            isAiGenerated: true,
            requireComposite: false
        });
        logger.info(`[TryOn] ✅ Job ${jobId} completed via Replicate IDM-VTON`);
        return;

    } catch (err) {
        logger.warn(`[TryOn] ⚠️ Replicate failed for job ${jobId}: ${err.message}`);
        update({ progress: 85, message: '🎨 Đang dùng phương án dự phòng...' });
    }

    // ── Fallback: Canvas composite (client-side) ────────────
    update({
        status:    'completed',
        progress:  100,
        message:   '✨ Thử đồ hoàn tất (Smart Fitting)!',
        resultImage: null,
        requireComposite: true,
        isAiGenerated: false,
        userImage:  userImageBase64,
        garmentUrl: garmentImageUrl,
        category:   category || 'upper_body'
    });
    logger.info(`[TryOn] ⚡ Job ${jobId} completed via Canvas fallback`);
}

// ─── ENDPOINT: Kiểm tra trạng thái job ───────────────────────

exports.getJobStatus = async (req, res) => {
    const job = jobsStore.get(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or expired' });
    res.json({ success: true, job });
};

// ─── ENDPOINTS: Lịch sử thử đồ ───────────────────────────────

const { TryOnHistoryModel } = require('../models/TryOnHistory');

exports.saveHistory = async (req, res, next) => {
    try {
        const { userId, productId, productName, garmentImage, userImage, resultImage, selectedColor, selectedSize } = req.body;
        if (!userId || !productId || !resultImage) {
            return res.status(400).json({ success: false, message: 'Thiếu dữ liệu lưu lịch sử.' });
        }
        const id = `tryon-hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const historyItem = new TryOnHistoryModel({
            id, userId, productId,
            productName:   productName   || 'Sản phẩm',
            garmentImage,  userImage,    resultImage,
            selectedColor: selectedColor || '',
            selectedSize:  selectedSize  || ''
        });
        await historyItem.save();
        res.json({ success: true, historyItem });
    } catch (error) { next(error); }
};

exports.getHistory = async (req, res, next) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId.' });
        const history = await TryOnHistoryModel.find({ userId }).sort({ createdAt: -1 }).limit(20);
        res.json({ success: true, history });
    } catch (error) { next(error); }
};

exports.deleteHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;
        if (!id || !userId) return res.status(400).json({ success: false, message: 'Thiếu id hoặc userId.' });
        await TryOnHistoryModel.deleteOne({ id, userId });
        res.json({ success: true, message: 'Đã xóa lịch sử.' });
    } catch (error) { next(error); }
};
