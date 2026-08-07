const mongoose = require('mongoose');

// Cấu hình tổng thể Vòng quay may mắn (1 bản ghi duy nhất)
const luckyWheelConfigSchema = new mongoose.Schema({
    // 1. Trạng thái & Thời gian sự kiện
    isActive: { type: Boolean, default: true },                     // Bật/Tắt vòng quay (Hoạt động / Bảo trì)
    startDate: { type: Date, default: null },                       // Ngày bắt đầu
    endDate: { type: Date, default: null },                         // Ngày kết thúc

    // 2. Quy tắc lượt quay & Reset
    resetInterval: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' }, // Chu kỳ reset
    spinsPerPeriod: { type: Number, default: 1 },                   // Tổng lượt quay mặc định mỗi chu kỳ
    maxSpinsPerAccount: { type: Number, default: 30 },              // Giới hạn mỗi tài khoản (0 = không giới hạn)

    // 3. Bảo mật & Chống Spam
    maxSpinsPerIP: { type: Number, default: 3 },                    // Giới hạn lượt quay mỗi IP (0 = không giới hạn)
    maxSpinsPerDevice: { type: Number, default: 3 },                // Giới hạn lượt quay mỗi thiết bị (0 = không giới hạn)

    // 4. Điều kiện & Hiển thị
    onlyNewMembers: { type: Boolean, default: false },              // Chỉ thành viên mới (tạo tài khoản gần đây / chưa có đơn)
    requireLogin: { type: Boolean, default: true },                 // Yêu cầu đăng nhập để quay
    showProbability: { type: Boolean, default: true },              // Hiển thị xác suất trúng thưởng công khai

    // 5. Danh sách phần thưởng
    prizes: [{
        id: String,
        label: String,
        reward: String,
        type: { type: String, enum: ['none', 'fixed', 'percent', 'shipping'], default: 'none' },
        coupon_code: String,
        discount_value: Number,
        probability: Number,
        valid_hours: Number,
        quantity: Number,
        remaining: Number,
        color: String,
        active: { type: Boolean, default: true },
    }]
}, { timestamps: true });

// Lịch sử quay
const luckyWheelLogSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    prize_id: { type: String, required: true },
    prize_label: { type: String, required: true },
    spin_date: { type: Date, default: Date.now }
}, { timestamps: true });

const LuckyWheelConfigModel = mongoose.models.LuckyWheelConfig || mongoose.model('LuckyWheelConfig', luckyWheelConfigSchema);
const LuckyWheelLogModel = mongoose.models.LuckyWheelLog || mongoose.model('LuckyWheelLog', luckyWheelLogSchema);

module.exports = { LuckyWheelConfigModel, LuckyWheelLogModel };
