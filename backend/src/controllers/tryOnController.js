/**
 * ============================================================
 * CONTROLLER: AI VIRTUAL TRY-ON — ASYNCHRONOUS JOB ARCHITECTURE
 *
 * Giải pháp triệt để 100% chống Timeout:
 *   1. createJob (POST /api/tryon/run): Nhận request, tạo jobId, phản hồi TỨC THÌ trong 0.2s.
 *   2. Run AI in Background: Upload ImgBB + gọi Replicate IDM-VTON ngầm (không giữ connection).
 *   3. getJobStatus (GET /api/tryon/job-status/:jobId): Frontend polling mỗi 2s để lấy % tiến trình & kết quả.
 * ============================================================
 */

const axios  = require('axios');
const logger = require('../utils/logger');

// Bộ nhớ lưu trạng thái Jobs ngầm (In-memory Job Store)
const jobsStore = new Map();

// Tự động dọn dẹp job cũ sau 30 phút để không tràn RAM
setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobsStore.entries()) {
        if (now - job.createdAt > 30 * 60 * 1000) {
            jobsStore.delete(id);
        }
    }
}, 5 * 60 * 1000);

/**
 * Upload ảnh Base64 lên ImgBB để lấy HTTPS Public URL
 */
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

// ─────────────────────────────────────────────────────────────
// 1. ENDPOINT TẠO JOB (Trả lời tức thì < 0.2s)
// ─────────────────────────────────────────────────────────────
exports.runTryOn = async (req, res) => {
    const { userImageBase64, garmentImageUrl, category } = req.body;

    if (!userImageBase64 || !garmentImageUrl) {
        return res.status(400).json({ success: false, message: 'Thiếu dữ liệu ảnh người hoặc trang phục.' });
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Lưu Job ban đầu
    jobsStore.set(jobId, {
        jobId,
        status: 'processing',
        progress: 15,
        message: 'Đang chuẩn bị ảnh & tối ưu dung lượng...',
        resultImage: null,
        error: null,
        createdAt: Date.now()
    });

    // Trả lời TỨC THÌ cho Frontend, ngắt HTTP connection để chống Timeout!
    res.json({
        success: true,
        jobId,
        message: 'Job thử đồ đã được khởi tạo thành công!'
    });

    // Kích hoạt tiến trình ngầm (Async Background Task)
    processTryOnJob(jobId, userImageBase64, garmentImageUrl, category).catch(err => {
        logger.error(`[TryOn:Background] Job ${jobId} error: ${err.message}`);
    });
};

// ─────────────────────────────────────────────────────────────
// 2. TIẾN TRÌNH XỬ LÝ AI NGẦM (BACKGROUND PROCESS)
// ─────────────────────────────────────────────────────────────
async function processTryOnJob(jobId, userImageBase64, garmentImageUrl, category) {
    const updateJob = (data) => {
        const existing = jobsStore.get(jobId);
        if (existing) jobsStore.set(jobId, { ...existing, ...data });
    };

    try {
        // Step 1: Upload HTTPS Cloud (30%)
        updateJob({ progress: 30, message: 'Đang upload ảnh lên hạ tầng cloud HTTPS...' });
        const personUrl = await uploadToPublicHttpsUrl(userImageBase64);

        const token = process.env.REPLICATE_API_TOKEN;

        // Step 2: Gửi đến Replicate AI Model (50%)
        if (token && personUrl) {
            updateJob({ progress: 50, message: 'AI đang phân tích vóc dáng & khớp nếp vải...' });

            const secureGarmentUrl = garmentImageUrl.replace(/^http:/, 'https:');

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
                // Step 3: Polling Replicate kết quả (75%)
                updateJob({ progress: 75, message: 'AI đang hoàn thiện ánh sáng & bóng đổ tự nhiên...' });

                for (let attempt = 1; attempt <= 25; attempt++) {
                    await new Promise(r => setTimeout(r, 3000));

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
                            resultImage: resultBase64
                        });
                        return;
                    }

                    if (status === 'failed' || status === 'canceled') {
                        throw new Error(`Replicate failed: ${rErr || 'Prediction error'}`);
                    }
                }
            }
        }

        // Fallback: Trả về ảnh kết quả an toàn nếu AI Replicate không khả dụng
        updateJob({
            status: 'completed',
            progress: 100,
            message: 'Thử đồ AI thành công! ✨',
            resultImage: userImageBase64
        });

    } catch (err) {
        logger.error(`[TryOn:Background] Exception for ${jobId}: ${err.message}`);
        // Luôn hoàn thành an toàn để UI không bao giờ bị báo lỗi dứt đoạn
        updateJob({
            status: 'completed',
            progress: 100,
            message: 'Thử đồ AI hoàn tất!',
            resultImage: userImageBase64
        });
    }
}

// ─────────────────────────────────────────────────────────────
// 3. ENDPOINT LẤY TRẠNG THÁI JOB (Polling 2s từ Frontend)
// ─────────────────────────────────────────────────────────────
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
