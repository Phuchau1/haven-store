/**
 * ============================================================
 * CONTROLLER: AI VIRTUAL TRY-ON — SYNCHRONOUS FLOW
 *
 * Flow hoàn chỉnh:
 *   1. Nhận base64 ảnh người + URL ảnh sản phẩm từ frontend
 *   2. Tạo HTTPS Public URL cho ảnh người (dùng ImgBB / Cloudinary Unsigned API)
 *   3. Gọi Replicate IDM-VTON với (personUrl, garmentUrl)
 *   4. Polling kết quả Replicate (tối đa 90 giây)
 *   5. Download ảnh kết quả → trả về base64
 * ============================================================
 */

const axios  = require('axios');
const logger = require('../utils/logger');

/**
 * Upload ảnh Base64 lên ImgBB / Cloudinary Unsigned API để lấy HTTPS Public URL chuẩn 100%
 * Replicate yêu cầu URL phải là HTTPS công khai tốc độ cao.
 */
async function uploadToPublicHttpsUrl(base64DataUrl) {
    const cleanBase64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');

    // ── Solution 1: ImgBB Public API (Nhanh & 100% HTTPS)
    try {
        const formData = new URLSearchParams();
        formData.append('image', cleanBase64);
        formData.append('key', '6d207e02198a847aa98d0a2a901485a5'); // Public Free API Key

        const res = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000
        });

        if (res.data?.data?.url) {
            const httpsUrl = res.data.data.url.replace(/^http:/, 'https:');
            logger.info(`[TryOn:Upload] ImgBB upload thành công: ${httpsUrl}`);
            return httpsUrl;
        }
    } catch (imgbbErr) {
        logger.warn(`[TryOn:Upload] ImgBB upload thất bại (${imgbbErr.message}). Thử giải pháp 2...`);
    }

    // ── Solution 2: FreeImage.host API
    try {
        const formData = new URLSearchParams();
        formData.append('source', cleanBase64);
        formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
        formData.append('action', 'upload');
        formData.append('format', 'json');

        const res = await axios.post('https://freeimage.host/api/1/upload', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000
        });

        if (res.data?.image?.url) {
            const httpsUrl = res.data.image.url.replace(/^http:/, 'https:');
            logger.info(`[TryOn:Upload] FreeImage upload thành công: ${httpsUrl}`);
            return httpsUrl;
        }
    } catch (freeImgErr) {
        logger.warn(`[TryOn:Upload] FreeImage upload thất bại (${freeImgErr.message})`);
    }

    throw new Error('Không thể tải ảnh lên bộ nhớ tạm công khai. Vui lòng thử lại!');
}

/** Map danh mục sản phẩm → chuẩn IDM-VTON */
function mapCategory(cat = '') {
    const c = cat.toLowerCase();
    if (['quan', 'pants', 'jeans', 'shorts', 'skirt', 'bottoms'].some(k => c.includes(k))) return 'lower_body';
    if (['dress', 'vay', 'dam', 'one-piece', 'jumpsuit'].some(k => c.includes(k))) return 'dresses';
    return 'upper_body';
}

/** Download ảnh từ URL → base64 data URL */
async function downloadToBase64(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    const mime = res.headers['content-type'] || 'image/png';
    return `data:${mime};base64,${Buffer.from(res.data).toString('base64')}`;
}

// ─────────────────────────────────────────────────────────────
// Controller Main
// ─────────────────────────────────────────────────────────────

/**
 * @route  POST /api/tryon/run
 * @desc   Gọi Replicate IDM-VTON, trả ảnh kết quả
 */
exports.runTryOn = async (req, res) => {
    req.setTimeout && req.setTimeout(120000);
    res.setTimeout && res.setTimeout(120000);

    const { userImageBase64, garmentImageUrl, category } = req.body;

    if (!userImageBase64) {
        return res.status(400).json({ success: false, message: 'Thiếu ảnh người dùng.' });
    }
    if (!garmentImageUrl) {
        return res.status(400).json({ success: false, message: 'Thiếu URL ảnh trang phục.' });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
        return res.status(500).json({
            success: false,
            message: 'REPLICATE_API_TOKEN chưa được cấu hình trên Render server.'
        });
    }

    try {
        // ── Bước 1: Tạo Public HTTPS URL cho ảnh người
        logger.info('[TryOn] Uploading user photo to high-speed HTTPS public cloud...');
        const personUrl = await uploadToPublicHttpsUrl(userImageBase64);
        logger.info(`[TryOn] Person Public HTTPS URL: ${personUrl}`);

        // Đảm bảo garmentImageUrl cũng là https
        const secureGarmentUrl = garmentImageUrl.replace(/^http:/, 'https:');

        // ── Bước 2: Tạo Prediction trên Replicate
        logger.info('[TryOn] Creating Replicate IDM-VTON prediction...');
        const createRes = await axios.post(
            'https://api.replicate.com/v1/models/yisol/idm-vton/predictions',
            {
                input: {
                    human_img:       personUrl,        // ✅ HTTPS Public URL
                    garm_img:        secureGarmentUrl, // ✅ HTTPS Public URL
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
                    'Content-Type':  'application/json'
                },
                timeout: 35000
            }
        );

        const predId = createRes.data?.id;
        if (!predId) {
            throw new Error('Replicate không trả về Prediction ID.');
        }
        logger.info(`[TryOn] Prediction ID: ${predId} — Polling...`);

        // ── Bước 3: Polling kết quả (tối đa 90 giây)
        for (let attempt = 1; attempt <= 22; attempt++) {
            await new Promise(r => setTimeout(r, 4000));

            const pollRes = await axios.get(
                `https://api.replicate.com/v1/predictions/${predId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 15000
                }
            );

            const { status, output, error: rErr } = pollRes.data;
            logger.info(`[TryOn] Poll #${attempt} status=${status}`);

            if (status === 'succeeded') {
                const resultUrl = Array.isArray(output) ? output[0] : output;
                if (!resultUrl) throw new Error('Replicate trả về kết quả rỗng.');

                logger.info(`[TryOn] ✅ Download result: ${resultUrl}`);
                const resultBase64 = await downloadToBase64(resultUrl);

                return res.json({
                    success:     true,
                    resultImage: resultBase64,
                    provider:    'replicate_idm_vton'
                });
            }

            if (status === 'failed' || status === 'canceled') {
                throw new Error(`Replicate IDM-VTON ${status}: ${rErr || 'Prediction error'}`);
            }
        }

        throw new Error('Timeout: AI quá thời gian xử lý (90s). Vui lòng thử lại!');

    } catch (err) {
        logger.error(`[TryOn] Error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: err.message || 'Lỗi xử lý AI. Vui lòng thử lại.'
        });
    }
};
