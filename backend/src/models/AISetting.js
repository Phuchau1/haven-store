const mongoose = require('mongoose');

const aiSettingSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true,
        enum: ['chat', 'style', 'tryon'],
        unique: true
    },
    apiKey: { 
        type: String, 
        required: false, // Có thể lấy từ biến môi trường nếu trống
        default: ''
    },
    systemPrompt: { 
        type: String, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

const AISettingModel = mongoose.models.AISetting || mongoose.model('AISetting', aiSettingSchema);

module.exports = { AISettingModel };
