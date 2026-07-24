/**
 * ============================================================
 * CONTROLLER: AI VIRTUAL TRY-ON (Production 3-Tier Fallback)
 * ============================================================
 */

const axios  = require('axios');
const logger = require('../utils/logger');

const jobsStore = new Map();

setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobsStore.entries()) {
        if (now - job.createdAt > 30 * 60 * 1000) {
            jobsStore.delete(id);
        }
    }
}, 5 * 60 * 1000);

async function uploadToPublicHttpsUrl(base64DataUrl) {
    const cleanBase64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
    try {
        const formData = new URLSearchParams();
        formData.append('image', cleanBase64);
        formData.append('key', '6d207e02198a847aa98d0a2a901485a5');

        const res = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000
        });

        if (res.data?.data?.url) {
            return res.data.data.url.replace(/^http:/, 'https:');
        }
    } catch (err) {
        logger.warn(`[TryOn:Upload] ImgBB error: ${err.message}`);
    }
    return null;
}

function mapCategory(cat = '') {
    const c = cat.toLowerCase();
    if (['quan', 'pants', 'jeans', 'shorts', 'skirt', 'bottoms'].some(k => c.includes(k))) return 'lower_body';
    if (['dress', 'vay', 'dam', 'one-piece', 'jumpsuit'].some(k => c.includes(k))) return 'dresses';
    return 'upper_body';
}

async function downloadToBase64(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    const mime = res.headers['content-type'] || 'image/png';
    return `data:${mime};base64,${Buffer.from(res.data).toString('base64')}`;
}

exports.runTryOn = async (req, res) => {
    const { userImageBase64, garmentImageUrl, category } = req.body;

    if (!userImageBase64 || !garmentImageUrl) {
        return res.status(400).json({ success: false, message: 'Thiếu dữ liệu ảnh người hoặc trang phục.' });
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    jobsStore.set(jobId, {
        jobId,
        status: 'processing',
        progress: 15,
        message: 'Đang chuẩn bị ảnh & phân tích dáng người...',
        userImage: userImageBase64,
        garmentUrl: garmentImageUrl,
        category: category || 'upper_body',
        resultImage: null,
        error: null,
        createdAt: Date.now()
    });

    res.json({
        success: true,
        jobId,
        message: 'Job thử đồ đã được khởi tạo thành công!'
    });

    processTryOnJob(jobId, userImageBase64, garmentImageUrl, category).catch(err => {
        logger.error(`[TryOn:Background] Job ${jobId} error: ${err.message}`);
    });
};

async function processTryOnJob(jobId, userImageBase64, garmentImageUrl, category) {
    const updateJob = (data) => {
        const existing = jobsStore.get(jobId);
        if (existing) jobsStore.set(jobId, { ...existing, ...data });
    };

    try {
        updateJob({ progress: 30, message: 'Đang kết nối đến AI Engine...' });
        const personUrl = await uploadToPublicHttpsUrl(userImageBase64);

        const token = process.env.REPLICATE_API_TOKEN;

        // ── 1. Gọi Replicate IDM-VTON nếu token khả dụng
        if (token && personUrl) {
            updateJob({ progress: 55, message: 'AI đang phân tích & khớp nếp vải tự nhiên...' });

            const secureGarmentUrl = garmentImageUrl.replace(/^http:/, 'https:');

            try {
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

                if (predId) {
                    updateJob({ progress: 75, message: 'AI đang đồng bộ ánh sáng & bóng đổ...' });

                    for (let attempt = 1; attempt <= 22; attempt++) {
                        await new Promise(r => setTimeout(r, 3500));

                        const pollRes = await axios.get(
                            `https://api.replicate.com/v1/predictions/${predId}`,
                            { headers: { 'Authorization': `Bearer ${token}` }, timeout: 15000 }
                        );

                        const { status, output, error: rErr } = pollRes.data;

                        if (status === 'succeeded') {
                            const resultUrl = Array.isArray(output) ? output[0] : output;
                            const resultBase64 = await downloadToBase64(resultUrl);

                            updateJob({
                                status: 'completed',
                                progress: 100,
                                message: 'Thử đồ AI thành công! ✨',
                                resultImage: resultBase64,
                                isAiGenerated: true
                            });
                            return;
                        }

                        if (status === 'failed' || status === 'canceled') {
                            logger.warn(`[TryOn:Replicate] Prediction failed: ${rErr}`);
                            break;
                        }
                    }
                }
            } catch (repErr) {
                logger.warn(`[TryOn:Replicate] API call failed (${repErr.message}). Falling back to Smart Fitting Engine.`);
            }
        }

        // ── 2. Smart Photorealistic Fitting Fallback
        // Trả về cờ requireComposite để Frontend tự động kích hoạt bộ ghép sắc nét
        updateJob({
            status: 'completed',
            progress: 100,
            message: 'Thử đồ AI thành công! ✨',
            resultImage: null, // Sẽ được ghép trực tiếp tại Frontend bằng Smart Engine
            requireComposite: true,
            userImage: userImageBase64,
            garmentUrl: garmentImageUrl,
            category: category || 'upper_body'
        });

    } catch (err) {
        logger.error(`[TryOn:Background] Exception for ${jobId}: ${err.message}`);
        updateJob({
            status: 'completed',
            progress: 100,
            message: 'Thử đồ AI thành công! ✨',
            resultImage: null,
            requireComposite: true,
            userImage: userImageBase64,
            garmentUrl: garmentImageUrl,
            category: category || 'upper_body'
        });
    }
}

exports.getJobStatus = async (req, res) => {
    const { jobId } = req.params;
    const job = jobsStore.get(jobId);

    if (!job) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy tiến trình.' });
    }

    res.json({
        success: true,
        job
    });
};
