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

const MALE_TEMPLATE = 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&h=800&fit=crop';
const FEMALE_TEMPLATE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop';

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

/** Upload base64 image or pass URL through ImgBB to get public HTTPS URL */
async function uploadToImgBBIfNeeded(img) {
    if (img.startsWith('data:image')) {
        const clean = img.replace(/^data:image\/\w+;base64,/, '');
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
    return img;
}

async function uploadBase64ToImgBB(base64DataUrl) {
    return await uploadToImgBBIfNeeded(base64DataUrl);
}

// ─── Replicate IDM-VTON ───────────────────────────────────────

async function runReplicateIDMVTON(personImg, garmentUrl, category) {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error('REPLICATE_API_TOKEN not configured');

    logger.info('[TryOn] Uploading person image to ImgBB if needed...');
    const personUrl = await uploadToImgBBIfNeeded(personImg);
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
                'Prefer':        'wait'
            },
            timeout: 120000
        }
    );

    const predId = createRes.data?.id;
    if (!predId) throw new Error('No prediction ID from Replicate');
    logger.info(`[TryOn] Prediction ID: ${predId} — polling...`);

    // ── Poll kết quả (tối đa 3 phút) ───────────────────────
    const MAX_POLLS = 36;
    for (let i = 1; i <= MAX_POLLS; i++) {
        await new Promise(r => setTimeout(r, 5000));

        const poll = await axios.get(
            `https://api.replicate.com/v1/predictions/${predId}`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 15000
            }
        );

        const { status, output, error: rErr } = poll.data;
        logger.info(`[TryOn] Poll ${i}/${MAX_POLLS} → status: ${status}`);

        if (status === 'succeeded') {
            const outputUrl = Array.isArray(output) ? output[0] : output;
            if (!outputUrl) throw new Error('Replicate returned empty output');
            logger.info(`[TryOn] ✅ IDM-VTON succeeded: ${outputUrl}`);
            return outputUrl;
        }

        if (status === 'failed' || status === 'canceled') {
            throw new Error(`Replicate ${status}: ${rErr || 'unknown error'}`);
        }
    }

    throw new Error('Replicate timeout after 3 minutes');
}

// ─── Replicate Face Swap ──────────────────────────────────────

async function runReplicateFaceSwap(targetImageUrl, swapImageUrl) {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error('REPLICATE_API_TOKEN not configured');

    logger.info('[TryOn] Creating Replicate Face Swap prediction...');
    const createRes = await axios.post(
        'https://api.replicate.com/v1/models/lucataco/faceswap/predictions',
        {
            input: {
                target_image: targetImageUrl,
                swap_image:   swapImageUrl
            }
        },
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type':  'application/json'
            },
            timeout: 120000
        }
    );

    const predId = createRes.data?.id;
    if (!predId) throw new Error('No prediction ID from Replicate FaceSwap');
    logger.info(`[TryOn] FaceSwap Prediction ID: ${predId} — polling...`);

    const MAX_POLLS = 24; // 24 * 3s = 72s
    for (let i = 1; i <= MAX_POLLS; i++) {
        await new Promise(r => setTimeout(r, 3000));

        const poll = await axios.get(
            `https://api.replicate.com/v1/predictions/${predId}`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 15000
            }
        );

        const { status, output, error: rErr } = poll.data;
        logger.info(`[TryOn] FaceSwap Poll ${i}/${MAX_POLLS} → status: ${status}`);

        if (status === 'succeeded') {
            const outputUrl = Array.isArray(output) ? output[0] : output;
            if (!outputUrl) throw new Error('Replicate FaceSwap returned empty output');
            logger.info(`[TryOn] ✅ FaceSwap succeeded: ${outputUrl}`);
            return outputUrl;
        }

        if (status === 'failed' || status === 'canceled') {
            throw new Error(`Replicate FaceSwap ${status}: ${rErr || 'unknown error'}`);
        }
    }

    throw new Error('Replicate FaceSwap timeout');
}

// ─── ENDPOINT: Tạo job thử đồ ────────────────────────────────

exports.runTryOn = async (req, res) => {
    const { userImageBase64, garmentImageUrl, category, tryOnMode, gender } = req.body;

    if (!userImageBase64 || !garmentImageUrl) {
        return res.status(400).json({ success: false, message: 'Thiếu ảnh người dùng hoặc ảnh sản phẩm.' });
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    jobsStore.set(jobId, {
        jobId,
        status:    'processing',
        progress:  5,
        message:   tryOnMode === 'perfect' ? '🚀 Đang khởi động AI FaceSwap Studio...' : '🚀 Đang khởi động IDM-VTON AI...',
        resultImage: null,
        requireComposite: false,
        userImage:   userImageBase64,
        garmentUrl:  garmentImageUrl,
        category:    category || 'upper_body',
        tryOnMode:   tryOnMode || 'standard',
        gender:      gender || 'female',
        createdAt:   Date.now()
    });

    // Trả về ngay lập tức
    res.json({ success: true, jobId });

    // Xử lý ngầm
    _processJob(jobId, userImageBase64, garmentImageUrl, category, tryOnMode, gender).catch(err => {
        logger.error(`[TryOn] Unhandled job error: ${err.message}`);
    });
};

// ─── Xử lý ngầm ──────────────────────────────────────────────

async function _processJob(jobId, userImageBase64, garmentImageUrl, category, tryOnMode, gender) {
    const update = (data) => {
        const j = jobsStore.get(jobId);
        if (j) jobsStore.set(jobId, { ...j, ...data });
    };

    try {
        if (tryOnMode === 'perfect') {
            update({ progress: 15, message: '📸 Đang chuẩn bị khuôn mặt...' });
            const userFaceUrl = await uploadBase64ToImgBB(userImageBase64);

            let modelTemplateUrl = FEMALE_TEMPLATE;
            if (gender === 'male') {
                modelTemplateUrl = MALE_TEMPLATE;
            } else if (gender === 'female') {
                modelTemplateUrl = FEMALE_TEMPLATE;
            } else {
                const cat = (category || '').toLowerCase();
                const isMaleCat = ['men', 'nam', 'unisex'].some(k => cat.includes(k));
                const isFemaleCat = ['women', 'nu', 'dress', 'vay', 'dam', 'skirt'].some(k => cat.includes(k));
                if (isMaleCat) modelTemplateUrl = MALE_TEMPLATE;
                else if (isFemaleCat) modelTemplateUrl = FEMALE_TEMPLATE;
            }

            update({ progress: 30, message: '👗 AI đang mặc trang phục lên người mẫu...' });
            const dressedModelUrl = await runReplicateIDMVTON(modelTemplateUrl, garmentImageUrl, category);

            update({ progress: 65, message: '🎭 Đang ghép khuôn mặt của bạn vào người mẫu...' });
            const finalImageUrl = await runReplicateFaceSwap(dressedModelUrl, userFaceUrl);

            update({ progress: 85, message: '✨ Đang đồng bộ hóa kết quả...' });
            const result = await urlToBase64(finalImageUrl);

            update({
                status:      'completed',
                progress:    100,
                message:     '✨ AI thử đồ hoàn hảo thành công!',
                resultImage: result,
                isAiGenerated: true,
                requireComposite: false
            });
            logger.info(`[TryOn] ✅ Perfect TryOn Job ${jobId} completed`);
        } else {
            // Standard tryon on user's own body
            update({ progress: 20, message: '🤖 IDM-VTON đang phân tích ảnh người...' });
            const dressedUrl = await runReplicateIDMVTON(userImageBase64, garmentImageUrl, category);
            
            update({ progress: 80, message: '✨ Đang chuẩn bị kết quả...' });
            const result = await urlToBase64(dressedUrl);

            update({
                status:      'completed',
                progress:    100,
                message:     '✨ AI thử đồ thành công!',
                resultImage: result,
                isAiGenerated: true,
                requireComposite: false
            });
            logger.info(`[TryOn] ✅ Standard TryOn Job ${jobId} completed`);
        }
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
    logger.info(`[TryOn] ✅ Fallback applied for job ${jobId}`);
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
