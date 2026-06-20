const mongoose = require('mongoose');

// Cấu hình của Vòng quay may mắn (1 bản ghi duy nhất)
const luckyWheelConfigSchema = new mongoose.Schema({
    prizes: [{
        id: Number,
        label: String,
        type: {
            type: String, // 'discount', 'freeship', 'retry'
        },
        value: String,
        color: String,
        probability: Number // Tỉ lệ trúng (%)
    }],
    isActive: { type: Boolean, default: true },
    spinsPerDay: { type: Number, default: 1 } // Số lượt quay tối đa mỗi ngày
}, { timestamps: true });

// Lịch sử quay của người dùng
const luckyWheelLogSchema = new mongoose.Schema({
    user_id: { type: String, required: true }, // custom string id (not MongoDB ObjectId)
    prize_id: { type: Number, required: true },
    prize_label: { type: String, required: true },
    spin_date: { type: Date, default: Date.now }
}, { timestamps: true });

const LuckyWheelConfigModel = mongoose.models.LuckyWheelConfig || mongoose.model('LuckyWheelConfig', luckyWheelConfigSchema);
const LuckyWheelLogModel = mongoose.models.LuckyWheelLog || mongoose.model('LuckyWheelLog', luckyWheelLogSchema);

module.exports = { LuckyWheelConfigModel, LuckyWheelLogModel };
