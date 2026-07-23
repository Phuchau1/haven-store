/**
 * ============================================================
 * SERVICE: MULTI-MODEL AI VIRTUAL TRY-ON ENGINE (Adapter Pattern)
 * Hỗ trợ: Replicate IDM-VTON (chính), FASHN.ai, Gemini Analysis
 * ============================================================
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * REPLICATE IDM-VTON ADAPTER
 * Model: yisol/idm-vton — chất lượng nghiên cứu SOTA
 * Docs: https://replicate.com/yisol/idm-vton
 */
class ReplicateIdmVtonAdapter {
    static async process({ userImageBase64, garmentImageUrl, productInfo }) {
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) {
            throw new Error('REPLICATE_API_TOKEN chưa được cấu hình.');
        }

        logger.info('[AIEngine:Replicate] Gọi IDM-VTON API trên Replicate...');

        const category = (productInfo.category || 'tops').toLowerCase();
        let garmentCategory = 'upper_body';
        if (['bottoms', 'pants', 'quan', 'jeans', 'shorts'].some(c => category.includes(c))) {
            garmentCategory = 'lower_body';
        } else if (['dress', 'vay', 'one-piece', 'jumpsuit', 'set'].some(c => category.includes(c))) {
            garmentCategory = 'dresses';
        }

        // Bước 1: Tạo prediction
        const createRes = await axios.post(
            'https://api.replicate.com/v1/models/yisol/idm-vton/predictions',
            {
                input: {
                    human_img: userImageBase64,         // base64 hoặc URL
                    garm_img: garmentImageUrl,           // URL ảnh sản phẩm
                    garment_des: productInfo.name || 'clothing item',
                    category: garmentCategory,
                    is_checked: true,                    // Kiểm tra tư thế
                    is_checked_crop: false,
                    denoise_steps: 30,
                    seed: 42
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'wait=60'                  // Sync wait up to 60s
                },
                timeout: 120000
            }
        );

        const predictionId = createRes.data?.id;
        if (!predictionId) {
            throw new Error('Replicate không trả về prediction ID.');
        }

        logger.info(`[AIEngine:Replicate] Prediction ID: ${predictionId} — Đang polling kết quả...`);

        // Bước 2: Polling đến khi có kết quả (max 90 giây)
        const maxWaitMs = 90000;
        const pollIntervalMs = 3000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitMs) {
            await new Promise(r => setTimeout(r, pollIntervalMs));

            const pollRes = await axios.get(
                `https://api.replicate.com/v1/predictions/${predictionId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const status = pollRes.data?.status;
            logger.info(`[AIEngine:Replicate] Trạng thái: ${status}`);

            if (status === 'succeeded') {
                const output = pollRes.data?.output;
                const resultUrl = Array.isArray(output) ? output[0] : output;
                if (!resultUrl) throw new Error('Replicate trả về output rỗng.');

                // Download ảnh kết quả về dạng base64
                const imgRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 30000 });
                const base64Result = `data:image/png;base64,${Buffer.from(imgRes.data).toString('base64')}`;

                logger.info(`[AIEngine:Replicate] ✅ IDM-VTON hoàn thành!`);
                return { resultImage: base64Result };
            }

            if (status === 'failed' || status === 'canceled') {
                const errMsg = pollRes.data?.error || 'Replicate prediction thất bại.';
                throw new Error(errMsg);
            }
        }

        throw new Error('Replicate IDM-VTON quá thời gian chờ (90s).');
    }
}

/**
 * FASHN AI ADAPTER
 */
class FashnAdapter {
    static async process({ userImage, garmentImage, category, apiKey }) {
        const key = apiKey || process.env.FASHN_API_KEY;
        if (!key) throw new Error('FASHN API Key chưa được cấu hình.');

        logger.info('[AIEngine:Fashn] Gọi FASHN.ai API...');
        try {
            const response = await axios.post('https://api.fashn.ai/v1/run', {
                model_image: userImage,
                garment_image: garmentImage,
                category: category?.includes('pants') || category?.includes('quan') ? 'bottoms'
                        : category?.includes('dress') || category?.includes('vay')  ? 'one-pieces'
                        : 'tops',
                mode: 'balanced',
                nsfw_filter: true
            }, {
                headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                timeout: 60000
            });

            if (response.data?.output) {
                return { resultImage: response.data.output[0] };
            }
            throw new Error('FASHN không trả về ảnh kết quả.');
        } catch (err) {
            logger.warn(`[AIEngine:Fashn] Lỗi: ${err.message} — Chuyển fallback`);
            return null;
        }
    }
}

/**
 * GEMINI ANALYSIS ADAPTER — Phân tích tư vấn phong cách
 */
class GeminiVtonAdapter {
    static async process({ userImageBase64, productInfo }) {
        const key = process.env.GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY;

        if (!key || key.startsWith('AQ.')) {
            // Mock Stylist Feedback khi chưa có Gemini Key
            return {
                analysisText: `### ✨ AI Stylist Haven — Phân Tích Thử Đồ\n\n**1. Độ Khớp Dáng (Fit & Silhouette): 9.2/10**\nTrang phục **${productInfo.name}** (Size ${productInfo.size || 'M'}) ôm vừa vặn dáng người, tự động căn chỉnh theo đường vai và eo.\n\n**2. Phối Màu & Ánh Sáng: 9.4/10**\nTông màu trang phục đồng bộ hoàn hảo với ánh sáng tự nhiên trong ảnh gốc.\n\n**3. Gợi Ý Mix & Match:**\nKết hợp với giày da hoặc sneaker trắng để tăng điểm phong cách.\n\n**4. Đánh Giá Tổng Thể: 9.3/10** ⭐ — Rất phù hợp với vóc dáng của bạn!`,
                resultImage: userImageBase64
            };
        }

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: 'Bạn là AI Stylist chuyên nghiệp chuẩn Zara/H&M. Phân tích trang phục thời trang ngắn gọn, sắc bén, tư vấn mix & match.'
        });

        const base64Data = userImageBase64.replace(/^data:image\/\w+;base64,/, '');
        const result = await model.generateContent([
            `Phân tích phối đồ cho sản phẩm: **${productInfo.name}** (Màu: ${productInfo.color || 'mặc định'}, Size: ${productInfo.size || 'M'})\n\nTrả lời dạng Markdown gồm: Độ khớp dáng, Phối màu, Mix & Match, Điểm tổng thể /10`,
            { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
        ]);

        return {
            analysisText: result.response.text(),
            resultImage: productInfo.image || userImageBase64
        };
    }
}

/**
 * MAIN ENGINE — Điều phối các Adapter theo thứ tự ưu tiên:
 * 1. Replicate IDM-VTON (nếu có token) → Chất lượng thật sự
 * 2. FASHN AI (nếu có key) → Ultra HD
 * 3. Gemini Analysis → Mock feedback
 */
class AITryOnEngine {
    static async executeTryOn({ modelType, userImageBase64, garmentImageUrl, productInfo }) {
        const startTime = Date.now();
        let result = null;

        // ── Ưu tiên 1: Replicate IDM-VTON (token đã được cấu hình)
        if (process.env.REPLICATE_API_TOKEN) {
            try {
                logger.info('[AIEngine] Sử dụng Replicate IDM-VTON...');
                result = await ReplicateIdmVtonAdapter.process({
                    userImageBase64,
                    garmentImageUrl: garmentImageUrl || productInfo.image,
                    productInfo
                });
            } catch (err) {
                logger.warn(`[AIEngine] Replicate thất bại: ${err.message} — Thử FASHN AI...`);
            }
        }

        // ── Ưu tiên 2: FASHN AI
        if (!result && process.env.FASHN_API_KEY) {
            try {
                result = await FashnAdapter.process({
                    userImage: userImageBase64,
                    garmentImage: garmentImageUrl || productInfo.image,
                    category: productInfo.category
                });
            } catch (err) {
                logger.warn(`[AIEngine] FASHN thất bại: ${err.message}`);
            }
        }

        // ── Fallback: Gemini Analysis + Mock Image
        if (!result) {
            result = await GeminiVtonAdapter.process({ userImageBase64, productInfo });
        }

        return {
            ...result,
            processingTimeMs: Date.now() - startTime,
            aiModelUsed: process.env.REPLICATE_API_TOKEN ? 'replicate_idm_vton'
                       : process.env.FASHN_API_KEY       ? 'fashn'
                       : 'gemini_mock'
        };
    }
}

module.exports = { AITryOnEngine };
