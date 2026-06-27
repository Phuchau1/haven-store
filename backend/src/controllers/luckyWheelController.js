const SpinReward = require('../models/SpinReward');
const SpinHistory = require('../models/SpinHistory');
const UserCoupon = require('../models/UserCoupon');
const logger = require('../utils/logger');

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

exports.spin = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        // Check if user already spun today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
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

        // Random based on probability
        const totalProb = rewards.reduce((sum, p) => sum + p.probability, 0);
        let rand = Math.random() * totalProb;
        let winPrize = rewards[0];

        for (const p of rewards) {
            rand -= p.probability;
            if (rand <= 0) {
                winPrize = p;
                break;
            }
        }

        // Save history
        await SpinHistory.create({
            user_id: String(userId),
            reward_id: winPrize._id,
            reward_text: winPrize.reward
        });

        // Save coupon if won
        let createdCoupon = null;
        if (winPrize.type !== 'none' && winPrize.valid_hours > 0) {
            // Generate unique code if needed or use base code + random
            const uniqueCode = `${winPrize.coupon_code}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            createdCoupon = await UserCoupon.create({
                user_id: String(userId),
                coupon_code: uniqueCode,
                type: winPrize.type,
                discount_value: winPrize.discount_value,
                expires_at: new Date(Date.now() + winPrize.valid_hours * 3600000)
            });
        }

        res.json({ success: true, prize: winPrize, coupon: createdCoupon });
    } catch (error) {
        logger.error('Error spinning wheel: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateConfig = async (req, res) => {
    try {
        await SpinReward.deleteMany({});
        await initDefaultRewards();
        res.json({ success: true, message: 'Đã cập nhật tỉ lệ thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
