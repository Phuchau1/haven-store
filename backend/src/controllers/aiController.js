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
        
        const setting = await AISettingModel.findOne({ type });
        if (!setting || !setting.isActive) {
            return res.status(403).json({ success: false, message: 'Tính năng AI này đang bị tắt.' });
        }

        const apiKey = setting.apiKey || process.env.GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: 'Chưa cấu hình API Key cho AI.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: setting.systemPrompt
        });

        // Xây dựng history cho chat
        const formattedHistory = messages.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.parts[0].text }]
        }));
        
        const currentMessage = messages[messages.length - 1].parts[0].text;
        
        let promptWithContext = currentMessage;
        if (productContext) {
             promptWithContext += `\n\n[Dữ liệu Sản Phẩm Hiện Tại trong Kho]:\n${productContext}`;
        }

        let result;
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
    } catch (error) {
        logger.error('Error in AI generate: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
