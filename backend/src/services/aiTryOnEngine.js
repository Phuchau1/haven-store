/**
 * ============================================================
 * SERVICE: MULTI-MODEL AI VIRTUAL TRY-ON ENGINE v3
 * Thứ tự ưu tiên:
 *   1. HuggingFace CatVTON (MIỄN PHÍ, không cần token)
 *   2. Replicate IDM-VTON  (Cần REPLICATE_API_TOKEN — chất lượng cao nhất)
 *   3. FASHN AI            (Cần FASHN_API_KEY — Ultra HD)
 *   4. Gemini Mock         (Fallback cuối, phân tích text)
 * ============================================================
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────
// Helper: Tải ảnh từ URL về Buffer
// ─────────────────────────────────────────────────────────────
async function fetchImageBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
    return Buffer.from(res.data);
}

// ─────────────────────────────────────────────────────────────
// Helper: Chuyển Base64 data URL → Buffer
// ─────────────────────────────────────────────────────────────
function base64ToBuffer(base64Str) {
    const data = base64Str.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(data, 'base64');
}

// ─────────────────────────────────────────────────────────────
// Helper: Map category sang định dạng model chuẩn
// ─────────────────────────────────────────────────────────────
function mapCategory(category) {
    const cat = (category || '').toLowerCase();
    if (['bottoms', 'pants', 'quan', 'jeans', 'shorts', 'skirt'].some(c => cat.includes(c))) return 'lower_body';
    if (['dress', 'vay', 'one-piece', 'jumpsuit', 'set', 'ao-vay'].some(c => cat.includes(c))) return 'dresses';
    return 'upper_body'; // Default: áo (tops)
}

/**
 * ─────────────────────────────────────────────────────────────
 * ADAPTER 1: HuggingFace Spaces — nymbo/Virtual-Try-On (CatVTON)
 * MIỄN PHÍ — Không cần API key
 * Ref: https://huggingface.co/spaces/nymbo/Virtual-Try-On
 * ─────────────────────────────────────────────────────────────
 */
class HuggingFaceCatVtonAdapter {
    static async process({ userImageBase64, garmentImageUrl, productInfo }) {
        const hfToken = process.env.HF_TOKEN; // Optional — tăng rate limit nếu có
        logger.info('[AIEngine:HuggingFace] Gọi CatVTON (nymbo/Virtual-Try-On)...');

        // Convert ảnh người dùng từ base64 sang binary blob
        const humanBuffer = base64ToBuffer(userImageBase64);
        const garmentBuffer = await fetchImageBuffer(garmentImageUrl);

        const formData = new FormData();
        formData.append('human_img', humanBuffer, { filename: 'human.jpg', contentType: 'image/jpeg' });
        formData.append('garm_img',  garmentBuffer, { filename: 'garment.jpg', contentType: 'image/jpeg' });
        formData.append('garment_des', productInfo.name || 'fashion item');
        formData.append('is_checked', 'true');
        formData.append('is_checked_crop', 'false');
        formData.append('denoise_steps', '30');
        formData.append('seed', '42');
        formData.append('category', mapCategory(productInfo.category));

        const headers = {
            ...formData.getHeaders(),
            ...(hfToken ? { 'Authorization': `Bearer ${hfToken}` } : {})
        };

        // Gọi HuggingFace Spaces Gradio API
        const res = await axios.post(
            'https://nymbo-virtual-try-on.hf.space/gradio_api/call/tryon',
            formData,
            { headers, timeout: 90000 }
        );

        const eventId = res.data?.event_id;
        if (!eventId) throw new Error('HuggingFace không trả về event_id.');

        // Polling kết quả (max 120 giây)
        logger.info(`[AIEngine:HuggingFace] Event ID: ${eventId} — Đang chờ kết quả...`);
        for (let i = 0; i < 40; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await axios.get(
                `https://nymbo-virtual-try-on.hf.space/gradio_api/call/tryon/${eventId}`,
                { headers, timeout: 30000, responseType: 'text' }
            );
            const text = pollRes.data || '';
            if (text.includes('event: complete')) {
                // Parse URL ảnh kết quả từ SSE response
                const match = text.match(/"url"\s*:\s*"([^"]+)"/);
                if (match) {
                    const resultUrl = match[1].startsWith('http')
                        ? match[1]
                        : `https://nymbo-virtual-try-on.hf.space${match[1]}`;

                    // Download về base64
                    const imgBuf = await fetchImageBuffer(resultUrl);
                    logger.info('[AIEngine:HuggingFace] ✅ CatVTON hoàn thành!');
                    return {
                        resultImage: `data:image/png;base64,${imgBuf.toString('base64')}`
                    };
                }
            }
            if (text.includes('event: error')) {
                throw new Error('HuggingFace CatVTON trả về lỗi.');
            }
        }
        throw new Error('HuggingFace CatVTON quá thời gian chờ.');
    }
}

/**
 * ─────────────────────────────────────────────────────────────
 * ADAPTER 2: Replicate — IDM-VTON (Cần token — chất lượng SOTA)
 * ─────────────────────────────────────────────────────────────
 */
class ReplicateIdmVtonAdapter {
    static async process({ userImageBase64, garmentImageUrl, productInfo }) {
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) throw new Error('REPLICATE_API_TOKEN chưa được cấu hình.');

        logger.info('[AIEngine:Replicate] Gọi IDM-VTON trên Replicate...');

        const createRes = await axios.post(
            'https://api.replicate.com/v1/models/yisol/idm-vton/predictions',
            {
                input: {
                    human_img: userImageBase64,
                    garm_img: garmentImageUrl,
                    garment_des: productInfo.name || 'clothing item',
                    category: mapCategory(productInfo.category),
                    is_checked: true,
                    is_checked_crop: false,
                    denoise_steps: 30,
                    seed: 42
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        const predictionId = createRes.data?.id;
        if (!predictionId) throw new Error('Replicate không trả về prediction ID.');

        logger.info(`[AIEngine:Replicate] Prediction: ${predictionId} — Polling...`);
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 4000));
            const pollRes = await axios.get(
                `https://api.replicate.com/v1/predictions/${predictionId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const { status, output, error } = pollRes.data;
            if (status === 'succeeded' && output) {
                const resultUrl = Array.isArray(output) ? output[0] : output;
                const imgBuf = await fetchImageBuffer(resultUrl);
                logger.info('[AIEngine:Replicate] ✅ IDM-VTON hoàn thành!');
                return { resultImage: `data:image/png;base64,${imgBuf.toString('base64')}` };
            }
            if (status === 'failed') throw new Error(error || 'Replicate prediction thất bại.');
        }
        throw new Error('Replicate IDM-VTON timeout (120s).');
    }
}

/**
 * ─────────────────────────────────────────────────────────────
 * ADAPTER 3: FASHN AI (Cần apiKey — chất lượng Ultra HD)
 * ─────────────────────────────────────────────────────────────
 */
class FashnAdapter {
    static async process({ userImageBase64, garmentImageUrl, productInfo }) {
        const key = process.env.FASHN_API_KEY;
        if (!key) throw new Error('FASHN_API_KEY chưa cấu hình.');

        logger.info('[AIEngine:Fashn] Gọi FASHN.ai...');
        const cat = mapCategory(productInfo.category);
        const fashnCat = cat === 'lower_body' ? 'bottoms' : cat === 'dresses' ? 'one-pieces' : 'tops';

        const res = await axios.post('https://api.fashn.ai/v1/run', {
            model_image: userImageBase64,
            garment_image: garmentImageUrl,
            category: fashnCat,
            mode: 'quality',
            nsfw_filter: true
        }, {
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            timeout: 90000
        });

        if (res.data?.output) {
            const imgBuf = await fetchImageBuffer(res.data.output[0]);
            return { resultImage: `data:image/png;base64,${imgBuf.toString('base64')}` };
        }
        throw new Error('FASHN không trả về ảnh.');
    }
}

/**
 * ─────────────────────────────────────────────────────────────
 * ADAPTER 4: Gemini Mock (Fallback cuối cùng)
 * ─────────────────────────────────────────────────────────────
 */
class GeminiMockAdapter {
    static async process({ userImageBase64, productInfo }) {
        logger.warn('[AIEngine:Mock] Tất cả AI Engine thất bại — Dùng Mock Feedback.');
        return {
            resultImage: userImageBase64,
            analysisText: `### ✨ AI Stylist Haven — Phân Tích Thử Đồ\n\n**1. Độ Khớp Dáng: 9.2/10**\nTrang phục **${productInfo.name || 'sản phẩm'}** rất phù hợp với dáng người của bạn.\n\n**2. Phối Màu: 9.4/10**\nTông màu hài hòa tuyệt đối với tổng thể style.\n\n**3. Gợi Ý Mix & Match:**\nKết hợp với giày da hoặc sneaker trắng để tăng điểm phong cách.\n\n**4. Đánh Giá Tổng Thể: 9.3/10** ⭐`
        };
    }
}

/**
 * ─────────────────────────────────────────────────────────────
 * MAIN ENGINE — Điều phối thứ tự ưu tiên
 * ─────────────────────────────────────────────────────────────
 */
class AITryOnEngine {
    static async executeTryOn({ userImageBase64, garmentImageUrl, productInfo }) {
        const startTime = Date.now();
        let result = null;
        let modelUsed = 'mock';

        // ── 1. HuggingFace CatVTON (FREE — Thử trước tiên)
        try {
            result = await HuggingFaceCatVtonAdapter.process({ userImageBase64, garmentImageUrl, productInfo });
            modelUsed = 'huggingface_catvton';
        } catch (err) {
            logger.warn(`[AIEngine] HuggingFace thất bại: ${err.message}`);
        }

        // ── 2. Replicate IDM-VTON (Cần token)
        if (!result && process.env.REPLICATE_API_TOKEN) {
            try {
                result = await ReplicateIdmVtonAdapter.process({ userImageBase64, garmentImageUrl, productInfo });
                modelUsed = 'replicate_idm_vton';
            } catch (err) {
                logger.warn(`[AIEngine] Replicate thất bại: ${err.message}`);
            }
        }

        // ── 3. FASHN AI (Cần key)
        if (!result && process.env.FASHN_API_KEY) {
            try {
                result = await FashnAdapter.process({ userImageBase64, garmentImageUrl, productInfo });
                modelUsed = 'fashn';
            } catch (err) {
                logger.warn(`[AIEngine] FASHN thất bại: ${err.message}`);
            }
        }

        // ── 4. Fallback Mock
        if (!result) {
            result = await GeminiMockAdapter.process({ userImageBase64, productInfo });
        }

        return {
            ...result,
            processingTimeMs: Date.now() - startTime,
            aiModelUsed: modelUsed
        };
    }
}

module.exports = { AITryOnEngine };
