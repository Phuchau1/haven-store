/**
 * ============================================================
 * CONTROLLER: TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI - Gemini API)
 * Mô tả: Cung cấp API gọi lên Google Gemini để xử lý các
 *        tính năng: Chat Bot, AI Stylist (Tư vấn thời trang), 
 *        AI Try-on (Phân tích ảnh thời trang).
 * ============================================================
 */
const { AISettingModel } = require('../models/AISetting');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

/**
 * @desc Khởi tạo cấu hình mặc định (System Prompts) nếu DB chưa có
 */
const initDefaultSettings = async () => {
    const defaults = [
        { type: 'chat', systemPrompt: 'Bạn là nhân viên tư vấn của PH Store. Hãy tư vấn nhiệt tình, ngắn gọn.' },
        { type: 'style', systemPrompt: 'Bạn là AI Stylist. Hãy gợi ý trang phục phù hợp với thông tin người dùng cung cấp.' },
        { type: 'tryon', systemPrompt: 'Bạn là chuyên gia phân tích hình ảnh thời trang. Hãy nhận xét về trang phục trong ảnh.' }
    ];
    for (const def of defaults) {
        const exists = await AISettingModel.findOne({ type: def.type });
        if (!exists) {
            await AISettingModel.create(def);
        }
    }
};

/**
 * @desc Lấy danh sách cấu hình AI từ database (dành cho Admin)
 */
exports.getSettings = async (req, res) => {
    try {
        await initDefaultSettings();
        const settings = await AISettingModel.find().lean();
        res.json({ success: true, settings });
    } catch (error) {
        logger.error('Error in getSettings: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Cập nhật cấu hình AI (System prompt, API Key riêng biệt nếu cần)
 */
exports.updateSetting = async (req, res) => {
    try {
        const { type } = req.params;
        const { apiKey, systemPrompt, isActive } = req.body;
        const updated = await AISettingModel.findOneAndUpdate(
            { type },
            { apiKey, systemPrompt, isActive },
            { new: true, runValidators: true }
        );
        res.json({ success: true, setting: updated });
    } catch (error) {
        logger.error('Error in updateSetting: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Gửi yêu cầu (Prompt) lên Google Gemini API và nhận kết quả trả về
 * @route POST /api/ai/generate
 * @param {string} type - 'chat', 'style', hoặc 'tryon'
 * @param {Array} messages - Lịch sử chat [{ role: 'user'/'model', parts: [{ text: '...' }] }]
 * @param {Object} productContext - Dữ liệu sản phẩm (nếu muốn AI tư vấn dựa trên hàng có sẵn)
 * @param {string} imageBase64 - Dữ liệu ảnh Base64 (Dùng cho tính năng Try-on)
 */
exports.generate = async (req, res) => {
    try {
        const { type, messages, productContext, imageBase64 } = req.body; 
        
        // Validate dữ liệu truyền lên
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, message: 'Messages không hợp lệ.' });
        }

        if (!type || !['chat', 'style', 'tryon'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type không hợp lệ.' });
        }

        // Lấy cấu hình System Prompt từ DB
        const setting = await AISettingModel.findOne({ type });
        if (!setting || !setting.isActive) {
            return res.status(403).json({ success: false, message: 'Tính năng AI này đang bị tắt.' });
        }

        // Lấy API Key (Ưu tiên Key trong DB, nếu không có thì lấy ở file .env)
        const apiKey = setting.apiKey || process.env.GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: 'Chưa cấu hình API Key cho AI.' });
        }

        // Khởi tạo SDK Google Generative AI
        const genAI = new GoogleGenerativeAI(apiKey);
        // Chọn Model: Xử lý ảnh dùng bản pro, text dùng bản flash cho nhanh
        const modelName = type === 'tryon' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: setting.systemPrompt // Nhúng System Prompt
        });

        // Parse lịch sử hội thoại (History) theo đúng chuẩn của Gemini SDK
        const formattedHistory = messages.slice(0, -1).map(msg => {
            if (!msg.parts || !msg.parts[0] || !msg.parts[0].text) {
                throw new Error('Định dạng message không hợp lệ.');
            }
            return {
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.parts[0].text }]
            };
        });
        
        // Trích xuất tin nhắn cuối cùng (Tin nhắn vừa gửi)
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage.parts || !lastMessage.parts[0] || !lastMessage.parts[0].text) {
            return res.status(400).json({ success: false, message: 'Message cuối cùng không hợp lệ.' });
        }
        const currentMessage = lastMessage.parts[0].text;
        
        // Nhồi thêm context sản phẩm vào prompt nếu có
        let promptWithContext = currentMessage;
        if (productContext) {
            promptWithContext += `\n\n[Dữ liệu Sản Phẩm Hiện Tại trong Kho]:\n${JSON.stringify(productContext)}`;
        }

        let result;
        try {
            // Nhánh 1: Xử lý ĐA PHƯƠNG TIỆN (Có ảnh)
            if (type === 'tryon' && imageBase64) {
                result = await model.generateContent([
                    promptWithContext,
                    { inlineData: { data: imageBase64, mimeType: "image/jpeg" } } // Gửi kèm ảnh Base64
                ]);
            } else {
                // Nhánh 2: Xử lý TEXT thông thường (Dùng tính năng startChat để nhớ ngữ cảnh)
                const chat = model.startChat({ history: formattedHistory });
                result = await chat.sendMessage(promptWithContext);
            }

            // Trích xuất text phản hồi từ AI
            const response = await result.response;
            const text = response.text();

            res.json({ success: true, text });
        } catch (aiError) {
            logger.error('Error in AI generation: ' + aiError.message);
            res.status(500).json({ success: false, message: 'Lỗi khi gọi API AI: ' + aiError.message });
        }
    } catch (error) {
        logger.error('Error in AI generate: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
