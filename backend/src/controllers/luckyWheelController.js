const { LuckyWheelConfigModel, LuckyWheelLogModel } = require('../models/LuckyWheelConfig');
const logger = require('../utils/logger');

// Init default wheel config if not exists
const initDefaultWheel = async () => {
    let config = await LuckyWheelConfigModel.findOne();
    if (!config) {
        config = await LuckyWheelConfigModel.create({
            isActive: true,
            spinsPerDay: 1,
            prizes: [
                { id: 1, label: 'Giảm 5%', type: 'discount', value: '5%', color: '#FFB300', probability: 20 },
                { id: 2, label: 'Giảm 10%', type: 'discount', value: '10%', color: '#FF8F00', probability: 12 },
                { id: 3, label: 'Chúc may mắn', type: 'retry', value: '', color: '#E65100', probability: 30 },
                { id: 4, label: 'Giảm 20%', type: 'discount', value: '20%', color: '#BF360C', probability: 5 },
                { id: 5, label: 'Freeship', type: 'freeship', value: '', color: '#FFB300', probability: 18 },
                { id: 6, label: 'Chúc may mắn', type: 'retry', value: '', color: '#FF8F00', probability: 30 },
                { id: 7, label: 'Voucher 50K', type: 'discount', value: '50000', color: '#E65100', probability: 8 },
                { id: 8, label: 'Freeship', type: 'freeship', value: '', color: '#BF360C', probability: 15 }
            ]
        });
    }
    return config;
};

exports.getConfig = async (req, res) => {
    try {
        const config = await initDefaultWheel();
        res.json({ success: true, config });
    } catch (error) {
        logger.error('Error getting LuckyWheel config: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateConfig = async (req, res) => {
    try {
        const { isActive, spinsPerDay, prizes } = req.body;
        // Tổng probability phải gần 100% (hoặc tự động quy đổi)
        let config = await LuckyWheelConfigModel.findOne();
        if (!config) {
            config = new LuckyWheelConfigModel();
        }
        config.isActive = isActive;
        config.spinsPerDay = spinsPerDay;
        config.prizes = prizes;
        await config.save();
        res.json({ success: true, config });
    } catch (error) {
        logger.error('Error updating LuckyWheel config: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const logs = await LuckyWheelLogModel.find().populate('user_id', 'name email').sort({ createdAt: -1 }).limit(100);
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.spin = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id; // MongoDB _id hoặc custom id

        const config = await LuckyWheelConfigModel.findOne();
        if (!config || !config.isActive) {
            return res.status(400).json({ success: false, message: 'Vòng quay may mắn đang tạm đóng.' });
        }

        // Kiểm tra số lượt quay trong ngày (match bằng custom id string)
        const today = new Date();
        today.setHours(0,0,0,0);
        const spinsToday = await LuckyWheelLogModel.countDocuments({
            user_id: String(userId),
            createdAt: { $gte: today }
        });

        if (spinsToday >= config.spinsPerDay) {
            return res.status(400).json({ success: false, message: 'Bạn đã hết lượt quay hôm nay.' });
        }

        // Random dựa trên probability
        const prizes = config.prizes;
        const totalProb = prizes.reduce((sum, p) => sum + (p.probability || 0), 0);
        let rand = Math.random() * totalProb;
        let winPrize = prizes[0];

        for (const p of prizes) {
            rand -= (p.probability || 0);
            if (rand <= 0) {
                winPrize = p;
                break;
            }
        }

        // Ghi log
        await LuckyWheelLogModel.create({
            user_id: String(userId),
            prize_id: winPrize.id,
            prize_label: winPrize.label
        });

        // (Nếu là giải thưởng lớn, có thể tạo Coupon thật luôn cho user ở đây)

        res.json({ success: true, prize: winPrize });
    } catch (error) {
        logger.error('Error spinning wheel: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
