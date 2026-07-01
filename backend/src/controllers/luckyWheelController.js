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
 * Response: { success, prizes: [...], config: { isActive, spinsPerDay, prizes } }
 */
exports.getConfig = async (req, res) => {
    try {
        await initDefaultRewards();
        const rewards = await SpinReward.find({ active: true });

        // Build config object phù hợp cho cả admin và client
        const config = {
            isActive: true,
            spinsPerDay: 1,
            prizes: rewards.map((r, i) => ({
                id: r._id.toString(),
                _id: r._id.toString(),
                label: r.reward,
                reward: r.reward,
                type: r.type,
                coupon_code: r.coupon_code,
                discount_value: r.discount_value,
                probability: r.probability,
                valid_hours: r.valid_hours,
                active: r.active,
                color: ['#FFB300', '#FF8F00', '#E65100', '#BF360C', '#FFB300', '#FF8F00', '#E65100', '#BF360C'][i % 8],
                value: r.type === 'fixed'
                    ? `${r.discount_value / 1000}K`
                    : r.type === 'percent'
                        ? `${r.discount_value}%`
                        : r.type === 'shipping'
                            ? 'Freeship'
                            : '-'
            }))
        };

        res.json({ success: true, prizes: rewards, config });
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

        // Trả về prize kèm theo _id string để frontend có thể match
        const prizeResponse = {
            _id: winPrize._id.toString(),
            id: winPrize._id.toString(),
            reward: winPrize.reward,
            type: winPrize.type,
            coupon_code: winPrize.coupon_code,
            discount_value: winPrize.discount_value,
            probability: winPrize.probability
        };

        res.json({ success: true, prize: prizeResponse, coupon: createdCoupon });
    } catch (error) {
        logger.error('Error spinning wheel: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Cập nhật toàn bộ cấu hình phần thưởng từ Admin
 * Body: { prizes: [ { id, reward, type, coupon_code, discount_value, probability, valid_hours } ] }
 */
exports.updateConfig = async (req, res) => {
    try {
        const { prizes } = req.body;

        if (!prizes || !Array.isArray(prizes) || prizes.length === 0) {
            // Nếu không có prizes -> reset về default
            await SpinReward.deleteMany({});
            await initDefaultRewards();
            return res.json({ success: true, message: 'Đã reset về cấu hình mặc định.' });
        }

        // Cập nhật từng prize theo _id
        const updateOps = prizes.map(async (p) => {
            const idStr = p._id || p.id;
            if (idStr && idStr.length === 24) {
                // Update existing
                return SpinReward.findByIdAndUpdate(idStr, {
                    reward: p.reward || p.label,
                    type: p.type,
                    coupon_code: p.coupon_code || '',
                    discount_value: Number(p.discount_value) || 0,
                    probability: Number(p.probability) || 0,
                    valid_hours: Number(p.valid_hours) || 0,
                    active: p.active !== false
                }, { new: true });
            } else {
                // Insert new
                return SpinReward.create({
                    reward: p.reward || p.label,
                    type: p.type,
                    coupon_code: p.coupon_code || '',
                    discount_value: Number(p.discount_value) || 0,
                    probability: Number(p.probability) || 0,
                    valid_hours: Number(p.valid_hours) || 0,
                    active: p.active !== false
                });
            }
        });

        await Promise.all(updateOps);
        res.json({ success: true, message: 'Đã lưu cấu hình vòng quay thành công.' });
    } catch (error) {
        logger.error('Error updating wheel config: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
