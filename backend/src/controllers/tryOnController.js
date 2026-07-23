/**
 * ============================================================
 * CONTROLLER: AI VIRTUAL TRY-ON — SYNCHRONOUS FLOW
 *
 * Flow hoàn chỉnh:
 *   1. Nhận base64 ảnh người + URL ảnh sản phẩm từ frontend
 *   2. Tạo public URL cho ảnh người (Lưu Express Static Uploads hoặc Cloudinary)
 *   3. Gọi Replicate IDM-VTON với (personUrl, garmentUrl)
 *   4. Polling kết quả Replicate (tối đa 90 giây)
 *   5. Download ảnh kết quả → trả về base64
 * ============================================================
 */

const fs         = require('fs');
const path       = require('path');
const cloudinary = require('cloudinary').v2;
const axios      = require('axios');
const logger     = require('../utils/logger');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Tạo Public HTTPS URL cho ảnh Base64
 * Ưu tiên:
 *   1. Thử Cloudinary (nếu credentials đúng)
 *   2. Fallback: Lưu vào folder static public/uploads của Express Server
 */
async function uploadToPublicUrl(base64DataUrl, req) {
    // ── 1. Thử Cloudinary nếu có cấu hình
    if (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL) {
        try {
            const dataUrl = base64DataUrl.startsWith('data:')
                ? base64DataUrl
                : `data:image/jpeg;base64,${base64DataUrl}`;

            const result = await cloudinary.uploader.upload(dataUrl, {
                folder: 'haven-tryon',
                resource_type: 'image'
            });

            if (result && result.secure_url) {
                logger.info(`[TryOn] Cloudinary upload thành công: ${result.secure_url}`);
                return result.secure_url;
            }
        } catch (cErr) {
            logger.warn(`[TryOn] Cloudinary upload thất bại (${cErr.message}). Chuyển sang Express Local Upload...`);
        }
    }

    // ── 2. Fallback bọc thép: Lưu file vào Express static /uploads
    try {
        const matches = base64DataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const base64String = matches ? matches[2] : base64DataUrl;
        const buffer = Buffer.from(base64String, 'base64');

        const filename = `tryon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
        const uploadDir = path.join(__dirname, '../../public/uploads');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);

        // Xác định host domain của backend
        const host = req.get('host');
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const publicUrl = `${protocol}://${host}/uploads/${filename}`;

        logger.info(`[TryOn] Lưu Express Static Upload thành công: ${publicUrl}`);
        return publicUrl;
    } catch (lErr) {
        logger.error(`[TryOn] Tất cả phương thức upload public URL đều thất bại: ${lErr.message}`);
        throw new Error('Không thể tạo public URL cho ảnh. Vui lòng thử lại.');
    }
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
            message: 'REPLICATE_API_TOKEN chưa được cấu hình trên server.'
        });
    }

    try {
        // ── Bước 1: Tạo public URL cho ảnh người
        logger.info('[TryOn] Creating public URL for user image...');
        const personUrl = await uploadToPublicUrl(userImageBase64, req);
        logger.info(`[TryOn] Person URL: ${personUrl}`);

        // ── Bước 2: Tạo Prediction trên Replicate
        logger.info('[TryOn] Creating Replicate IDM-VTON prediction...');
        const createRes = await axios.post(
            'https://api.replicate.com/v1/models/yisol/idm-vton/predictions',
            {
                input: {
                    human_img:       personUrl,       // ✅ Public HTTPS URL
                    garm_img:        garmentImageUrl, // ✅ Public HTTPS URL từ sản phẩm
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
