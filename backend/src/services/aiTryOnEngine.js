/**
 * ============================================================
 * SERVICE: AI VIRTUAL TRY-ON ENGINE v4 — PRODUCTION READY
 *
 * Flow chuẩn:
 *   1. Upload ảnh người dùng (base64) lên Cloudinary → lấy public URL
 *   2. Gửi (personUrl + garmentUrl) đến Replicate IDM-VTON
 *   3. Polling kết quả → download → trả về base64
 *   4. Fallback: Gemini Mock nếu mọi thứ thất bại
 *
 * Tại sao cần Cloudinary?
 *   Replicate và hầu hết AI API KHÔNG chấp nhận base64 trực tiếp
 *   trong body (quá lớn, timeout). Họ cần public HTTPS URL.
 * ============================================================
 */

const axios    = require('axios');
const cloudinary = require('cloudinary').v2;
const logger   = require('../utils/logger');

// ─────────────────────────────────────────────────────────────
// HELPER: Upload base64 image lên Cloudinary → trả về public URL
// ─────────────────────────────────────────────────────────────
async function uploadBase64ToCloudinary(base64DataUrl, folder = 'haven-tryon') {
    // base64DataUrl có thể có hoặc không có data:image/jpeg;base64, prefix
    const dataUrl = base64DataUrl.startsWith('data:')
        ? base64DataUrl
        : `data:image/jpeg;base64,${base64DataUrl}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
        folder,
        resource_type: 'image',
        transformation: [{ width: 768, height: 1024, crop: 'fit', quality: 90 }]
    });
    return result.secure_url; // Public HTTPS URL
}

// ─────────────────────────────────────────────────────────────
// HELPER: Map danh mục sản phẩm → định dạng IDM-VTON
// ─────────────────────────────────────────────────────────────
function mapCategory(category) {
    const cat = (category || '').toLowerCase();
    if (['pants', 'quan', 'jeans', 'shorts', 'skirt', 'bottoms', 'trou'].some(c => cat.includes(c))) {
        return 'lower_body';
    }
    if (['dress', 'vay', 'dam', 'one-piece', 'jumpsuit', 'overall'].some(c => cat.includes(c))) {
        return 'dresses';
    }
    return 'upper_body'; // Default: áo các loại
}

// ─────────────────────────────────────────────────────────────
// HELPER: Download ảnh từ URL → base64 data URL
// ─────────────────────────────────────────────────────────────
async function urlToBase64(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: { 'User-Agent': 'HavenStore/1.0' }
    });
    const mime = res.headers['content-type'] || 'image/png';
    return `data:${mime};base64,${Buffer.from(res.data).toString('base64')}`;
}

/**
 * ─────────────────────────────────────────────────────────────
 * ADAPTER: Replicate IDM-VTON (State-of-the-Art VTON Model)
 *
 * Model: yisol/idm-vton
 * Docs: https://replicate.com/yisol/idm-vton
 * Yêu cầu: REPLICATE_API_TOKEN trong env
 *
 * Input (đều phải là URL công khai — KHÔNG nhận base64):
 *   human_img: URL ảnh người (đã upload lên Cloudinary)
 *   garm_img:  URL ảnh trang phục (từ Cloudinary của sản phẩm)
 * ─────────────────────────────────────────────────────────────
 */
class ReplicateVtonAdapter {
    static async run({ personUrl, garmentUrl, productInfo }) {
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) throw new Error('Thiếu REPLICATE_API_TOKEN trong environment.');

        logger.info(`[VTON:Replicate] Bắt đầu IDM-VTON | person=${personUrl.slice(-40)} | garment=${garmentUrl.slice(-40)}`);

        const category = mapCategory(productInfo.category);

        // ── Bước 1: Tạo prediction trên Replicate
        const createRes = await axios.post(
            'https://api.replicate.com/v1/models/yisol/idm-vton/predictions',
            {
                input: {
                    human_img:    personUrl,                              // ✅ Public URL
                    garm_img:     garmentUrl,                             // ✅ Public URL
                    garment_des:  productInfo.name || 'fashion clothing', // Mô tả trang phục
                    category:     category,                               // upper_body/lower_body/dresses
                    is_checked:       true,                               // Auto-detect pose
                    is_checked_crop:  false,
                    denoise_steps:    30,                                 // Chất lượng vs tốc độ (20-40)
                    seed:             42
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const predId = createRes.data?.id;
        if (!predId) {
            throw new Error(`Replicate không trả về prediction ID. Response: ${JSON.stringify(createRes.data)}`);
        }
        logger.info(`[VTON:Replicate] Prediction created: ${predId} — bắt đầu polling...`);

        // ── Bước 2: Polling kết quả (tối đa 3 phút, poll mỗi 5 giây)
        const MAX_POLLS    = 36;   // 36 × 5s = 180s = 3 phút
        const POLL_DELAY   = 5000; // 5 giây

        for (let attempt = 1; attempt <= MAX_POLLS; attempt++) {
            await new Promise(r => setTimeout(r, POLL_DELAY));

            const pollRes = await axios.get(
                `https://api.replicate.com/v1/predictions/${predId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 15000
                }
            );

            const { status, output, error: replicateError, logs } = pollRes.data;
            logger.info(`[VTON:Replicate] Poll #${attempt} | status=${status}`);

            if (status === 'succeeded') {
                // Output là array URLs hoặc string URL
                const resultUrl = Array.isArray(output) ? output[0] : output;
                if (!resultUrl) throw new Error('Replicate trả về output rỗng.');

                logger.info(`[VTON:Replicate] ✅ Thành công! Downloading result: ${resultUrl}`);
                const base64Result = await urlToBase64(resultUrl);
                return { resultImage: base64Result, source: 'replicate_idm_vton' };
            }

            if (status === 'failed' || status === 'canceled') {
                throw new Error(`Replicate prediction ${status}: ${replicateError || 'Không có thông tin lỗi'}`);
            }

            // status: 'starting' | 'processing' — tiếp tục chờ
        }

        throw new Error('Replicate IDM-VTON timeout sau 3 phút.');
    }
}

/**
 * ─────────────────────────────────────────────────────────────
 * FALLBACK MOCK — Khi tất cả AI thất bại
 * Trả về ảnh người gốc + analysis text giả
 * ─────────────────────────────────────────────────────────────
 */
function getMockResult(userImageBase64, productInfo) {
    return {
        resultImage: userImageBase64,
        source: 'mock',
        analysisText: `### ✨ Haven AI Stylist — Phân Tích Trang Phục\n\n**1. Độ Khớp Dáng: 9.2/10**\nTrang phục **${productInfo.name || 'sản phẩm'}** rất phù hợp với vóc dáng của bạn.\n\n**2. Phối Màu & Ánh Sáng: 9.4/10**\nTông màu trang phục hài hòa hoàn hảo với tổng thể outfit.\n\n**3. Gợi Ý Mix & Match:**\n- Kết hợp với sneaker trắng hoặc giày da đen để tăng điểm phong cách\n- Thêm đồng hồ và dây chuyền đơn giản để hoàn thiện look\n\n**4. Đánh Giá Tổng Thể: 9.3/10** ⭐ — Rất phù hợp với bạn!`
    };
}

/**
 * ─────────────────────────────────────────────────────────────
 * MAIN ENGINE — Entry point duy nhất
 *
 * Gọi từ tryOnController.js với:
 *   { userImageBase64, garmentImageUrl, productInfo }
 * ─────────────────────────────────────────────────────────────
 */
class AITryOnEngine {
    static async executeTryOn({ userImageBase64, garmentImageUrl, productInfo }) {
        const startTime = Date.now();

        // ── Step A: Upload ảnh người lên Cloudinary → lấy public URL
        let personUrl = null;
        try {
            logger.info('[VTON:Engine] Uploading person image to Cloudinary...');
            personUrl = await uploadBase64ToCloudinary(userImageBase64, 'haven-tryon/persons');
            logger.info(`[VTON:Engine] Person URL: ${personUrl}`);
        } catch (uploadErr) {
            logger.error(`[VTON:Engine] Cloudinary upload thất bại: ${uploadErr.message}`);
            // Không thể upload → dùng mock ngay
            return {
                ...getMockResult(userImageBase64, productInfo),
                processingTimeMs: Date.now() - startTime,
                aiModelUsed: 'mock_cloudinary_failed'
            };
        }

        // ── Step B: Dùng garmentImageUrl trực tiếp (đã là Cloudinary URL từ sản phẩm)
        const garmentUrl = garmentImageUrl;
        if (!garmentUrl) {
            logger.warn('[VTON:Engine] Không có garmentImageUrl — dùng mock.');
            return {
                ...getMockResult(userImageBase64, productInfo),
                processingTimeMs: Date.now() - startTime,
                aiModelUsed: 'mock_no_garment'
            };
        }

        // ── Step C: Gọi Replicate IDM-VTON
        if (process.env.REPLICATE_API_TOKEN) {
            try {
                const result = await ReplicateVtonAdapter.run({ personUrl, garmentUrl, productInfo });
                return {
                    ...result,
                    processingTimeMs: Date.now() - startTime,
                    aiModelUsed: result.source
                };
            } catch (replicateErr) {
                logger.warn(`[VTON:Engine] Replicate thất bại: ${replicateErr.message} — Fallback mock.`);
            }
        } else {
            logger.warn('[VTON:Engine] REPLICATE_API_TOKEN không có — dùng mock.');
        }

        // ── Step D: Fallback Mock
        return {
            ...getMockResult(userImageBase64, productInfo),
            processingTimeMs: Date.now() - startTime,
            aiModelUsed: 'mock_fallback'
        };
    }
}

module.exports = { AITryOnEngine };
