/**
 * ============================================================
 * CONTROLLER: AI VIRTUAL TRY-ON — SYNCHRONOUS FLOW
 *
 * Flow hoàn chỉnh:
 *   1. Nhận base64 ảnh người + URL ảnh sản phẩm từ frontend
 *   2. Upload ảnh người lên Cloudinary → lấy public URL
 *   3. Gọi Replicate IDM-VTON với (personUrl, garmentUrl)
 *   4. Polling kết quả Replicate (tối đa 90 giây)
 *   5. Download ảnh kết quả → trả về base64
 *
 * Tại sao synchronous?
 *   - Đơn giản hơn nhiều (không cần DB, Job queue, polling frontend)
 *   - Frontend chỉ cần 1 request duy nhất, chờ kết quả
 *   - Phù hợp với Render (timeout mặc định 120s)
 * ============================================================
 */

const cloudinary = require('cloudinary').v2;
const axios      = require('axios');
const logger     = require('../utils/logger');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Upload base64 lên Cloudinary → trả về public HTTPS URL */
async function uploadToCloudinary(base64DataUrl) {
    const dataUrl = base64DataUrl.startsWith('data:')
        ? base64DataUrl
        : `data:image/jpeg;base64,${base64DataUrl}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
        folder: 'haven-tryon',
        resource_type: 'image'
    });
    return result.secure_url;
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
// Controller
// ─────────────────────────────────────────────────────────────

/**
 * @route  POST /api/tryon/run
 * @desc   Gọi Replicate IDM-VTON, trả ảnh kết quả
 * @body   { userImageBase64, garmentImageUrl, category }
 */
exports.runTryOn = async (req, res) => {
    // Set timeout dài hơn mặc định cho response này
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
            message: 'AI Try-On chưa được cấu hình. Vui lòng liên hệ quản trị viên.'
        });
    }

    try {
        // ── Bước 1: Upload ảnh người lên Cloudinary
        logger.info('[TryOn] Uploading person image to Cloudinary...');
        const personUrl = await uploadToCloudinary(userImageBase64);
        logger.info(`[TryOn] Person URL: ${personUrl}`);

        // ── Bước 2: Tạo Prediction trên Replicate
        logger.info('[TryOn] Creating Replicate IDM-VTON prediction...');
        const createRes = await axios.post(
            'https://api.replicate.com/v1/models/yisol/idm-vton/predictions',
            {
                input: {
                    human_img:       personUrl,       // ✅ Public URL
                    garm_img:        garmentImageUrl, // ✅ Public URL từ Cloudinary sản phẩm
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
                timeout: 30000
            }
        );

        const predId = createRes.data?.id;
        if (!predId) {
            throw new Error('Replicate không trả về Prediction ID.');
        }
        logger.info(`[TryOn] Prediction ID: ${predId} — Polling...`);

        // ── Bước 3: Polling kết quả (tối đa 90 giây, poll mỗi 4 giây)
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
                if (!resultUrl) throw new Error('Replicate trả về output rỗng.');

                // ── Bước 4: Download kết quả → base64
                logger.info(`[TryOn] ✅ Download result: ${resultUrl}`);
                const resultBase64 = await downloadToBase64(resultUrl);

                return res.json({
                    success:     true,
                    resultImage: resultBase64,
                    provider:    'replicate_idm_vton'
                });
            }

            if (status === 'failed' || status === 'canceled') {
                throw new Error(`Replicate ${status}: ${rErr || 'Unknown error'}`);
            }
            // status: 'starting' | 'processing' → tiếp tục chờ
        }

        throw new Error('Timeout: Replicate không trả kết quả sau 90 giây.');

    } catch (err) {
        logger.error(`[TryOn] Error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: err.message || 'Lỗi xử lý AI. Vui lòng thử lại.'
        });
    }
};
