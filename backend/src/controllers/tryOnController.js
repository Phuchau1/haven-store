/**
 * ============================================================
 * CONTROLLER: AI VIRTUAL TRY-ON — CatVTON + IDM-VTON + Smart Fallback
 *
 * Tier 1: HuggingFace Space CatVTON (nymbo/Virtual-Try-On) — FREE, No GPU needed
 * Tier 2: Replicate IDM-VTON — Paid backup
 * Tier 3: Smart Canvas Engine — Instant local fallback
 * ============================================================
 */

const axios  = require('axios');
const logger = require('../utils/logger');

// Job store in-memory
const jobsStore = new Map();

setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobsStore.entries()) {
        if (now - job.createdAt > 30 * 60 * 1000) jobsStore.delete(id);
    }
}, 5 * 60 * 1000);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function mapCategory(cat = '') {
    const c = cat.toLowerCase();
    if (['quan','pants','jeans','shorts','skirt','bottoms'].some(k => c.includes(k))) return 'lower_body';
    if (['dress','vay','dam','one-piece','jumpsuit'].some(k => c.includes(k))) return 'dresses';
    return 'upper_body';
}

async function downloadToBase64(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    const mime = res.headers['content-type'] || 'image/png';
    return `data:${mime};base64,${Buffer.from(res.data).toString('base64')}`;
}

/** Upload to ImgBB to get public HTTPS URL */
async function uploadToImgBB(base64DataUrl) {
    const clean = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
    try {
        const form = new URLSearchParams();
        form.append('image', clean);
        form.append('key', '6d207e02198a847aa98d0a2a901485a5');
        const res = await axios.post('https://api.imgbb.com/1/upload', form, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000
        });
        if (res.data?.data?.url) return res.data.data.url.replace(/^http:/, 'https:');
    } catch (err) {
        logger.warn(`[TryOn] ImgBB upload failed: ${err.message}`);
    }
    return null;
}

// ─────────────────────────────────────────────────────────────
// TIER 1: HuggingFace Space CatVTON via Gradio HTTP API
// Space: nymbo/Virtual-Try-On (FREE, public)
// ─────────────────────────────────────────────────────────────
async function callHuggingFaceCatVTON(personBase64, garmentUrl, category) {
    logger.info('[TryOn:HF] Calling HuggingFace nymbo/Virtual-Try-On via /run/predict...');

    // Upload person image to get public URL
    const personUrl = await uploadToImgBB(personBase64);
    if (!personUrl) throw new Error('ImgBB upload failed');

    const secureGarmentUrl = garmentUrl.replace(/^http:/, 'https:');

    const HF_SPACE_URL = 'https://nymbo-virtual-try-on.hf.space';

    // ── Gradio /run/predict — synchronous call (works for small queues)
    const predictRes = await axios.post(
        `${HF_SPACE_URL}/run/predict`,
        {
            fn_index: 0,
            data: [
                { background: personUrl, layers: [], composite: null },
                secureGarmentUrl,
                'Fashion clothing item',
                true,
                false,
                30,
                42
            ]
        },
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 120000   // 2 phút — CatVTON có thể mất 60-90s trên HF free tier
        }
    );

    logger.info(`[TryOn:HF] /run/predict response status: ${predictRes.status}`);

    const outputData = predictRes.data?.data;
    if (!outputData || !Array.isArray(outputData)) throw new Error('Invalid HuggingFace response');

    // Output[0] có thể là object {url, ...} hoặc string URL
    const first = outputData[0];
    let resultUrl = typeof first === 'string' ? first : (first?.url || first?.path);

    if (!resultUrl) throw new Error('No output URL from HuggingFace CatVTON');

    // Bổ sung domain nếu là relative path
    if (!resultUrl.startsWith('http')) resultUrl = `${HF_SPACE_URL}${resultUrl}`;

    logger.info(`[TryOn:HF] ✅ CatVTON result URL: ${resultUrl}`);
    return await downloadToBase64(resultUrl);
}

// ─────────────────────────────────────────────────────────────
// TIER 2: Replicate IDM-VTON
// ─────────────────────────────────────────────────────────────
async function callReplicateIDMVTON(personBase64, garmentUrl, category) {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error('No REPLICATE_API_TOKEN configured');

    logger.info('[TryOn:Replicate] Calling Replicate IDM-VTON...');

    const personUrl = await uploadToImgBB(personBase64);
    if (!personUrl) throw new Error('ImgBB upload failed');

    const secureGarmentUrl = garmentUrl.replace(/^http:/, 'https:');

    const createRes = await axios.post(
        'https://api.replicate.com/v1/models/yisol/idm-vton/predictions',
        {
            input: {
                human_img:       personUrl,
                garm_img:        secureGarmentUrl,
                garment_des:     'fashion clothing item',
                category:        mapCategory(category),
                is_checked:      true,
                is_checked_crop: false,
                denoise_steps:   30,
                seed:            42
            }
        },
        {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            timeout: 30000
        }
    );

    const predId = createRes.data?.id;
    if (!predId) throw new Error('No prediction ID from Replicate');

    logger.info(`[TryOn:Replicate] Prediction ${predId} - polling...`);

    for (let i = 1; i <= 22; i++) {
        await new Promise(r => setTimeout(r, 3500));
        const poll = await axios.get(
            `https://api.replicate.com/v1/predictions/${predId}`,
            { headers: { 'Authorization': `Bearer ${token}` }, timeout: 15000 }
        );
        const { status, output, error: rErr } = poll.data;
        if (status === 'succeeded') {
            const url = Array.isArray(output) ? output[0] : output;
            return await downloadToBase64(url);
        }
        if (status === 'failed' || status === 'canceled') {
            throw new Error(`Replicate ${status}: ${rErr}`);
        }
    }
    throw new Error('Replicate timeout');
}

// ─────────────────────────────────────────────────────────────
// ENDPOINT: Create Job
// ─────────────────────────────────────────────────────────────
exports.runTryOn = async (req, res) => {
    const { userImageBase64, garmentImageUrl, category } = req.body;

    if (!userImageBase64 || !garmentImageUrl) {
        return res.status(400).json({ success: false, message: 'Thiếu dữ liệu ảnh.' });
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    jobsStore.set(jobId, {
        jobId,
        status: 'processing',
        progress: 10,
        message: 'Đang khởi động AI Engine...',
        userImage: userImageBase64,
        garmentUrl: garmentImageUrl,
        category: category || 'upper_body',
        resultImage: null,
        requireComposite: false,
        createdAt: Date.now()
    });

    // Trả lời tức thì (< 200ms)
    res.json({ success: true, jobId });

    // Chạy ngầm
    processJob(jobId, userImageBase64, garmentImageUrl, category).catch(err => {
        logger.error(`[TryOn] Unhandled: ${err.message}`);
    });
};

// ─────────────────────────────────────────────────────────────
// Background Process: 3-Tier Fallback Chain
// Tier 1: Replicate IDM-VTON (có API key → ưu tiên)
// Tier 2: HuggingFace CatVTON (FREE backup)
// Tier 3: Smart Canvas Engine (luôn thành công)
// ─────────────────────────────────────────────────────────────
async function processJob(jobId, userImageBase64, garmentImageUrl, category) {
    const update = (data) => {
        const j = jobsStore.get(jobId);
        if (j) jobsStore.set(jobId, { ...j, ...data });
    };

    // ── Tier 1: Replicate IDM-VTON (AI chất lượng cao)
    if (process.env.REPLICATE_API_TOKEN) {
        try {
            update({ progress: 20, message: '🤖 IDM-VTON AI đang phân tích ảnh...' });
            const result = await callReplicateIDMVTON(userImageBase64, garmentImageUrl, category);
            update({ status: 'completed', progress: 100, message: '✨ AI thử đồ thành công!', resultImage: result, isAiGenerated: true });
            logger.info(`[TryOn] ✅ Tier-1 (Replicate IDM-VTON) succeeded for job ${jobId}`);
            return;
        } catch (err) {
            logger.warn(`[TryOn] Tier-1 Replicate failed: ${err.message}. Trying Tier-2...`);
            update({ progress: 50, message: '🔄 Đang chuyển sang AI Engine dự phòng...' });
        }
    }

    // ── Tier 2: HuggingFace CatVTON (FREE)
    try {
        update({ progress: 60, message: '🤖 CatVTON AI đang render...' });
        const result = await callHuggingFaceCatVTON(userImageBase64, garmentImageUrl, category);
        update({ status: 'completed', progress: 100, message: '✨ AI thử đồ thành công!', resultImage: result, isAiGenerated: true });
        logger.info(`[TryOn] ✅ Tier-2 (HuggingFace CatVTON) succeeded for job ${jobId}`);
        return;
    } catch (err) {
        logger.warn(`[TryOn] Tier-2 HuggingFace failed: ${err.message}. Using Tier-3 Canvas Engine...`);
        update({ progress: 80, message: '🎨 Đang sử dụng Smart Fitting Engine...' });
    }

    // ── Tier 3: Frontend Canvas Smart Engine (luôn thành công)
    update({
        status: 'completed',
        progress: 100,
        message: '✨ Thử đồ hoàn tất!',
        resultImage: null,
        requireComposite: true,
        userImage: userImageBase64,
        garmentUrl: garmentImageUrl,
        category: category || 'upper_body'
    });
    logger.info(`[TryOn] ✅ Tier-3 (Canvas) fallback applied for job ${jobId}`);
}

// ─────────────────────────────────────────────────────────────
// ENDPOINT: Get Job Status
// ─────────────────────────────────────────────────────────────
exports.getJobStatus = async (req, res) => {
    const job = jobsStore.get(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
};

// ─────────────────────────────────────────────────────────────
// ENDPOINTS: History Management
// ─────────────────────────────────────────────────────────────
const { TryOnHistoryModel } = require('../models/TryOnHistory');

exports.saveHistory = async (req, res, next) => {
    try {
        const { userId, productId, productName, garmentImage, userImage, resultImage, selectedColor, selectedSize } = req.body;
        if (!userId || !productId || !resultImage) {
            return res.status(400).json({ success: false, message: 'Thiếu dữ liệu lưu lịch sử.' });
        }

        const id = `tryon-hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const historyItem = new TryOnHistoryModel({
            id,
            userId,
            productId,
            productName: productName || 'Sản phẩm',
            garmentImage,
            userImage,
            resultImage,
            selectedColor: selectedColor || '',
            selectedSize: selectedSize || ''
        });

        await historyItem.save();
        res.json({ success: true, historyItem });
    } catch (error) {
        next(error);
    }
};

exports.getHistory = async (req, res, next) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId.' });

        const history = await TryOnHistoryModel.find({ userId }).sort({ createdAt: -1 }).limit(20);
        res.json({ success: true, history });
    } catch (error) {
        next(error);
    }
};

exports.deleteHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;
        if (!id || !userId) return res.status(400).json({ success: false, message: 'Thiếu id hoặc userId.' });

        await TryOnHistoryModel.deleteOne({ id, userId });
        res.json({ success: true, message: 'Đã xóa lịch sử thử đồ.' });
    } catch (error) {
        next(error);
    }
};

