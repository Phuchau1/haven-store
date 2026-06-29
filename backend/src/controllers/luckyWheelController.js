/**
 * ============================================================
 * CONTROLLER: VÒNG QUAY MAY MẮN (Lucky Wheel)
 * Mô tả: Quản lý logic cho trò chơi vòng quay may mắn.
 *        Xử lý thuật toán quay (tính tỷ lệ xác suất), 
 *        lưu lịch sử quay và tự động phát mã giảm giá.
 * ============================================================
 */
const SpinReward = require('../models/SpinReward');
const SpinHistory = require('../models/SpinHistory');
const UserCoupon = require('../models/UserCoupon');
const logger = require('../utils/logger');

/**
 * @desc Hàm khởi tạo dữ liệu mẫu cho các phần thưởng nếu chưa có trong DB.
 * Ghi chú: probability là tỷ lệ phần trăm (Tổng các probability không nhất thiết phải = 100).
 */
const initDefaultRewards = async () => {
    let count = await SpinReward.countDocuments();
    if (count === 0) {
        await SpinReward.insertMany([
            { reward: 'Chúc bạn may mắn lần sau', type: 'none', coupon_code: '', discount_value: 0, probability: 60, valid_hours: 0, active: true },
            { reward: 'Giảm 20.000đ', type: 'fixed', coupon_code: 'SPIN20', discount_value: 20000, probability: 15, valid_hours: 24, active: true },
            { reward: 'Giảm 30.000đ', type: 'fixed', coupon_code: 'SPIN30', discount_value: 30000, probability: 10, valid_hours: 24, active: true },
            { reward: 'Giảm 50.000đ', type: 'fixed', coupon_code: 'SPIN50', discount_value: 50000, probability: 6, valid_hours: 24, active: true },
            { reward: 'Freeship', type: 'shipping', coupon_code: 'FREESHIP', discount_value: 30000, probability: 5, valid_hours: 24, active: true },
            { reward: 'Giảm 100.000đ', type: 'fixed', coupon_code: 'SPIN100', discount_value: 100000, probability: 2, valid_hours: 24, active: true },
            { reward: 'Giảm 15%', type: 'percent', coupon_code: 'SPIN15', discount_value: 15, probability: 1.5, valid_hours: 24, active: true },
            { reward: 'Giảm 20%', type: 'percent', coupon_code: 'SPIN20P', discount_value: 20, probability: 0.5, valid_hours: 24, active: true }
        ]);
    }
};

/**
 * @desc Lấy danh sách các phần thưởng đang kích hoạt (active)
 */
exports.getConfig = async (req, res) => {
    try {
        await initDefaultRewards();
        const rewards = await SpinReward.find({ active: true });
        res.json({ success: true, prizes: rewards });
    } catch (error) {
        logger.error('Error getting LuckyWheel config: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Xử lý thao tác "Quay" của người dùng.
 * Các bước:
 * 1. Kiểm tra số lần đã quay trong ngày (Giới hạn 1 lần/ngày/user)
 * 2. Quay ngẫu nhiên dựa trên tỷ lệ trúng thưởng
 * 3. Ghi lại lịch sử trúng
 * 4. Nếu trúng giải -> Tạo UserCoupon cho người dùng
 */
exports.spin = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        // 1. Kiểm tra xem người dùng đã quay trong hôm nay chưa
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Đưa về 00:00:00 của ngày hôm nay
        
        const spinsToday = await SpinHistory.countDocuments({
            user_id: String(userId),
            spin_date: { $gte: today }
        });

        if (spinsToday >= 1) {
            return res.status(400).json({ success: false, message: 'Bạn đã hết lượt quay hôm nay. Vui lòng quay lại vào ngày mai!' });
        }

        const rewards = await SpinReward.find({ active: true });
        if (rewards.length === 0) {
            return res.status(400).json({ success: false, message: 'Vòng quay chưa được cấu hình.' });
        }

        // 2. Thuật toán chọn ngẫu nhiên theo tỷ lệ (Probability)
        const totalProb = rewards.reduce((sum, p) => sum + p.probability, 0);
        let rand = Math.random() * totalProb;
        let winPrize = rewards[0]; // Mặc định

        for (const p of rewards) {
            rand -= p.probability;
            if (rand <= 0) {
                winPrize = p;
                break;
            }
        }

        // 3. Lưu lại lịch sử
        await SpinHistory.create({
            user_id: String(userId),
            reward_id: winPrize._id,
            reward_text: winPrize.reward
        });

        // 4. Nếu trúng giải có giá trị -> Tự động sinh mã Coupon riêng cho User
        let createdCoupon = null;
        if (winPrize.type !== 'none' && winPrize.valid_hours > 0) {
            // Sinh mã code duy nhất (Vd: SPIN20_ABC12)
            const uniqueCode = `${winPrize.coupon_code}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            createdCoupon = await UserCoupon.create({
                user_id: String(userId),
                coupon_code: uniqueCode,
                type: winPrize.type,
                discount_value: winPrize.discount_value,
                expires_at: new Date(Date.now() + winPrize.valid_hours * 3600000) // 1 hour = 3600000 ms
            });
        }

        res.json({ success: true, prize: winPrize, coupon: createdCoupon });
    } catch (error) {
        logger.error('Error spinning wheel: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Reset / Cập nhật cấu hình vòng quay
 */
exports.updateConfig = async (req, res) => {
    try {
        await SpinReward.deleteMany({});
        await initDefaultRewards();
        res.json({ success: true, message: 'Đã cập nhật tỉ lệ thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
