const { AISettingModel } = require('../models/AISetting');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

// Init default settings if not exists
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

exports.generate = async (req, res) => {
    try {
        const { type, messages, productContext, imageBase64 } = req.body; // type: chat, style, tryon
        
        // Validate input
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, message: 'Messages không hợp lệ.' });
        }

        if (!type || !['chat', 'style', 'tryon'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type không hợp lệ.' });
        }

        const setting = await AISettingModel.findOne({ type });
        if (!setting || !setting.isActive) {
            return res.status(403).json({ success: false, message: 'Tính năng AI này đang bị tắt.' });
        }

        const apiKey = setting.apiKey || process.env.GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: 'Chưa cấu hình API Key cho AI.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = type === 'tryon' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: setting.systemPrompt
        });

        // Xây dựng history cho chat
        const formattedHistory = messages.slice(0, -1).map(msg => {
            if (!msg.parts || !msg.parts[0] || !msg.parts[0].text) {
                throw new Error('Định dạng message không hợp lệ.');
            }
            return {
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.parts[0].text }]
            };
        });
        
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage.parts || !lastMessage.parts[0] || !lastMessage.parts[0].text) {
            return res.status(400).json({ success: false, message: 'Message cuối cùng không hợp lệ.' });
        }
        const currentMessage = lastMessage.parts[0].text;
        
        let promptWithContext = currentMessage;
        if (productContext) {
            promptWithContext += `\n\n[Dữ liệu Sản Phẩm Hiện Tại trong Kho]:\n${JSON.stringify(productContext)}`;
        }

        let result;
        try {
            if (type === 'tryon' && imageBase64) {
                // Xử lý ảnh cho Try-On
                result = await model.generateContent([
                    promptWithContext,
                    { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
                ]);
            } else {
                // Xử lý text (Chat, Style)
                const chat = model.startChat({ history: formattedHistory });
                result = await chat.sendMessage(promptWithContext);
            }

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
