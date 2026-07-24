/**
 * ============================================================
 * CONTROLLER: AI STYLIST & RECOMMENDATION SYSTEM
 * ============================================================
 */

const UserProfile     = require('../models/UserProfile');
const Product         = require('../models/Product');
const aiStylistEngine = require('../services/aiStylistEngine');
const logger          = require('../utils/logger');

/**
 * @route   POST /api/ai-stylist/analyze
 * @desc    Phân tích ảnh & thông tin cơ thể -> Trả về AI Profile Dashboard
 */
exports.analyzeBodyAndStyle = async (req, res) => {
    try {
        const { userId = 'guest_user', base64Image, inputForm } = req.body;

        // 1. Phân tích cơ thể & màu sắc từ Vision/Form
        const analysis = await aiStylistEngine.analyzeUserPhotoAndBody(base64Image, inputForm || {});

        // 2. Tính toán size các hãng
        const brandSizes = aiStylistEngine.calculateBrandSizes(analysis.bodyScan);

        // 3. Cập nhật hoặc lưu mới User Profile vào Database
        let profile = await UserProfile.findOne({ userId });
        if (!profile) {
            profile = new UserProfile({ userId });
        }

        profile.bodyScan = analysis.bodyScan;
        profile.personalColor = analysis.personalColor;
        profile.brandSizes = brandSizes;
        await profile.save();

        return res.json({
            success: true,
            data: {
                userId,
                bodyScan: profile.bodyScan,
                personalColor: profile.personalColor,
                stylePreferences: profile.stylePreferences,
                brandSizes: profile.brandSizes
            }
        });
    } catch (err) {
        logger.error(`[AIStylistController:analyze] Error: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Lỗi phân tích AI.' });
    }
};

/**
 * @route   POST /api/ai-stylist/recommendations
 * @desc    Lấy danh sách sản phẩm cá nhân hóa + 10+ Outfit hoàn chỉnh + Match Score %
 */
exports.getRecommendations = async (req, res) => {
    try {
        const { userId = 'guest_user', occasion, weather } = req.body;

        let profile = await UserProfile.findOne({ userId });
        if (!profile) {
            // Tạo profile mặc định nếu chưa scan
            const defaultAnalysis = await aiStylistEngine.analyzeUserPhotoAndBody(null, {});
            profile = new UserProfile({
                userId,
                bodyScan: defaultAnalysis.bodyScan,
                personalColor: defaultAnalysis.personalColor,
                brandSizes: aiStylistEngine.calculateBrandSizes(defaultAnalysis.bodyScan)
            });
            await profile.save();
        }

        // 1. Tạo 10 Outfits hoàn chỉnh
        const outfits = await aiStylistEngine.generate10Outfits(profile, { occasion, weather });

        // 2. Lấy sản phẩm cá nhân hóa có Match Score %
        const allProducts = await Product.find({ status: 'published' }).limit(20).lean();
        const recommendedProducts = allProducts.map(p => {
            const matchScore = aiStylistEngine.calculateMatchScore(p, profile, { occasion });
            const explanations = aiStylistEngine.generateAIExplanations(p, profile);
            return {
                ...p,
                matchScore,
                explanations
            };
        }).sort((a, b) => b.matchScore - a.matchScore);

        return res.json({
            success: true,
            userProfile: profile,
            outfits,
            recommendedProducts
        });
    } catch (err) {
        logger.error(`[AIStylistController:recommendations] Error: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Lỗi lấy gợi ý thời trang.' });
    }
};

/**
 * @route   POST /api/ai-stylist/chat
 * @desc    Tư vấn phong cách thời trang từ AI Chat Stylist
 */
exports.chatStylist = async (req, res) => {
    try {
        const { userId = 'guest_user', message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập câu hỏi.' });
        }

        const profile = await UserProfile.findOne({ userId }).lean();
        const result = await aiStylistEngine.chatWithAIStylist(message, profile || {});

        return res.json({
            success: true,
            reply: result.reply,
            recommendedProducts: result.recommendedProducts
        });
    } catch (err) {
        logger.error(`[AIStylistController:chat] Error: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Lỗi tư vấn AI Stylist.' });
    }
};

/**
 * @route   POST /api/ai-stylist/interaction
 * @desc    Ghi nhận tương tác khách hàng (Like/Dislike/Thử đồ) để học máy
 */
exports.trackInteraction = async (req, res) => {
    try {
        const { userId = 'guest_user', productId, action } = req.body; // action: 'like' | 'dislike' | 'tryon'

        const profile = await UserProfile.findOne({ userId });
        if (profile && productId) {
            if (action === 'like' && !profile.interactionHistory.likedProductIds.includes(productId)) {
                profile.interactionHistory.likedProductIds.push(productId);
            } else if (action === 'tryon' && !profile.interactionHistory.tryOnProductIds.includes(productId)) {
                profile.interactionHistory.tryOnProductIds.push(productId);
            }
            await profile.save();
        }

        return res.json({ success: true, message: 'Đã cập nhật học máy preference.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
