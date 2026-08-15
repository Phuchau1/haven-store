/**
 * ============================================================
 * CONTROLLER: VÒNG QUAY MAY MẮN (Lucky Wheel)
 * Đồng bộ 11 thuộc tính cấu hình chung & thuật toán quay
 * ============================================================
 */
const SpinReward            = require('../models/SpinReward');
const SpinHistory           = require('../models/SpinHistory');
const UserCoupon            = require('../models/UserCoupon');
const UserSpinLimit         = require('../models/UserSpinLimit');
const { LuckyWheelConfigModel } = require('../models/LuckyWheelConfig');
const logger                = require('../utils/logger');
const { UserModel }         = require('../models/User');

const DEFAULT_COLORS = ['#E53E3E','#ED8936','#38A169','#3182CE','#D69E2E','#805AD5','#DD6B20','#319795'];

/** Format ngày thành 'YYYY-MM-DD' */
const toDateStr = (d = new Date()) => d.toISOString().split('T')[0];

/** Lấy thời điểm bắt đầu chu kỳ reset (ngày / tuần / tháng) */
const getPeriodStartDate = (resetInterval = 'daily') => {
    const now = new Date();
    if (resetInterval === 'weekly') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Thứ Hai
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }
    if (resetInterval === 'monthly') {
        return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }
    // Mặc định 'daily'
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

/** Khởi tạo hoặc lấy Cấu hình chung LuckyWheelConfig */
const sanitizePrize = (p, i) => {
    let type = p.type || 'fixed';
    if (type === 'discount' || type === 'voucher') type = 'fixed';
    if (type === 'freeship') type = 'shipping';
    if (type === 'retry') type = 'none';

    let reward = p.reward || p.label || '';
    let discount_value = Number(p.discount_value) || 0;

    // Tự động giải mã discount_value từ tên nếu discount_value đang bằng 0
    if (discount_value === 0 && reward) {
        const matchK = reward.match(/(\d+)\s*k/i);
        const matchVnd = reward.match(/(\d+[\d\.]*)\s*([đđ]|vnd)/i);
        const matchPercent = reward.match(/(\d+)\s*%/);

        if (matchPercent) {
            type = 'percent';
            discount_value = parseInt(matchPercent[1]);
        } else if (matchK) {
            type = 'fixed';
            discount_value = parseInt(matchK[1]) * 1000;
        } else if (matchVnd) {
            type = 'fixed';
            discount_value = parseInt(matchVnd[1].replace(/\./g, ''));
        }
    }

    if (!reward || reward.trim() === '' || reward === 'Giảm 0k') {
        if (type === 'none') reward = 'Chúc bạn may mắn lần sau';
        else if (type === 'shipping') reward = 'Freeship';
        else if (type === 'percent') reward = `Giảm ${discount_value || 10}%`;
        else reward = `Giảm ${(discount_value || 20000) / 1000}k`;
    }

    return {
        id:             p.id || p._id || `prize_${i + 1}`,
        _id:            p._id || p.id || `prize_${i + 1}`,
        label:          reward,
        reward:         reward,
        type,
        coupon_code:    p.coupon_code || (type !== 'none' ? `SPIN${i + 1}` : ''),
        discount_value,
        probability:    Number(p.probability) || (i === 0 ? 30 : 10),
        valid_hours:    Number(p.valid_hours) || 24,
        quantity:       Number(p.quantity) || 0,
        remaining:      Number(p.remaining) || 0,
        color:          p.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        active:         p.active !== false,
    };
};

/** Khởi tạo hoặc lấy Cấu hình chung LuckyWheelConfig */
const getOrCreateConfigDoc = async () => {
    let configDoc = await LuckyWheelConfigModel.findOne();
    if (!configDoc) {
        let rewards = await SpinReward.find({ active: true });
        if (!rewards || rewards.length === 0) {
            rewards = await SpinReward.insertMany([
                { reward: 'Chúc bạn may mắn lần sau', type: 'none',     coupon_code: '',         discount_value: 0,      probability: 30,  valid_hours: 0,  active: true, color: DEFAULT_COLORS[0] },
                { reward: 'Giảm 20.000đ',              type: 'fixed',    coupon_code: 'SPIN20',   discount_value: 20000,  probability: 15,  valid_hours: 24, active: true, color: DEFAULT_COLORS[1] },
                { reward: 'Giảm 30.000đ',              type: 'fixed',    coupon_code: 'SPIN30',   discount_value: 30000,  probability: 12,  valid_hours: 24, active: true, color: DEFAULT_COLORS[2] },
                { reward: 'Giảm 50.000đ',              type: 'fixed',    coupon_code: 'SPIN50',   discount_value: 50000,  probability: 8,   valid_hours: 24, active: true, color: DEFAULT_COLORS[3] },
                { reward: 'Freeship',                  type: 'shipping', coupon_code: 'FREESHIP', discount_value: 30000,  probability: 15,  valid_hours: 24, active: true, color: DEFAULT_COLORS[4] },
                { reward: 'Giảm 100.000đ',             type: 'fixed',    coupon_code: 'SPIN100',  discount_value: 100000, probability: 5,   valid_hours: 24, active: true, color: DEFAULT_COLORS[5] },
                { reward: 'Giảm 15%',                  type: 'percent',  coupon_code: 'SPIN15P',  discount_value: 15,     probability: 10,  valid_hours: 24, active: true, color: DEFAULT_COLORS[6] },
                { reward: 'Giảm 20%',                  type: 'percent',  coupon_code: 'SPIN20P',  discount_value: 20,     probability: 5,   valid_hours: 24, active: true, color: DEFAULT_COLORS[7] },
            ]);
        }

        configDoc = await LuckyWheelConfigModel.create({
            isActive: true,
            startDate: null,
            endDate: null,
            resetInterval: 'daily',
            spinsPerPeriod: 1,
            maxSpinsPerAccount: 30,
            maxSpinsPerIP: 3,
            maxSpinsPerDevice: 3,
            onlyNewMembers: false,
            requireLogin: true,
            showProbability: true,
            prizes: rewards.map((r, i) => sanitizePrize(r, i))
        });
    } else {
        // Tự động kiểm tra và sửa lỗi nếu DB có phần thưởng rỗng tên/type sai
        let needSave = false;
        const sanitized = configDoc.prizes.map((p, i) => {
            const clean = sanitizePrize(p, i);
            if (clean.reward !== p.reward || clean.type !== p.type) needSave = true;
            return clean;
        });

        if (needSave || !configDoc.prizes || configDoc.prizes.length === 0) {
            configDoc.prizes = sanitized;
            await configDoc.save();
        }
    }
    return configDoc;
};

// ────────────────────────────────────────────────────────────
// PUBLIC: Lấy cấu hình đầy đủ của Vòng quay
// ────────────────────────────────────────────────────────────
exports.getConfig = async (req, res) => {
    try {
        const configDoc = await getOrCreateConfigDoc();
        const prizes = (configDoc.prizes || []).filter(p => p.active !== false).map((p, i) => sanitizePrize(p, i));

        res.json({
            success: true,
            config: {
                ...configDoc.toObject(),
                prizes,
            },
            prizes,
        });
    } catch (error) {
        logger.error('getConfig error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ────────────────────────────────────────────────────────────
// PUBLIC: Kiểm tra user có thể quay không + Lý do đầy đủ
// GET /api/lucky-wheel/can-spin?user_id=xxx
// ────────────────────────────────────────────────────────────
exports.canSpin = async (req, res) => {
    try {
        const user_id = req.user ? String(req.user._id || req.user.id) : (req.query.user_id || req.body?.user_id || '');
        const ip     = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
        const device = req.headers['x-device-id'] || req.query.device_id || req.body?.device_id || '';

        const configDoc = await getOrCreateConfigDoc();
        const now = new Date();

        // 1. Kiểm tra Bật/Tắt
        if (!configDoc.isActive) {
            return res.json({
                success: true,
                canSpin: false,
                reason: 'disabled',
                message: 'Vòng quay may mắn đang tạm ngưng bảo trì.',
            });
        }

        // 2. Kiểm tra Ngày bắt đầu
        if (configDoc.startDate && now < new Date(configDoc.startDate)) {
            return res.json({
                success: true,
                canSpin: false,
                reason: 'not_started',
                message: `Sự kiện chưa bắt đầu (diễn ra từ ${new Date(configDoc.startDate).toLocaleDateString('vi-VN')}).`,
            });
        }

        // 3. Kiểm tra Ngày kết thúc
        if (configDoc.endDate && now > new Date(configDoc.endDate)) {
            return res.json({
                success: true,
                canSpin: false,
                reason: 'ended',
                message: `Sự kiện vòng quay đã kết thúc vào ngày ${new Date(configDoc.endDate).toLocaleDateString('vi-VN')}.`,
            });
        }

        // 4. Kiểm tra yêu cầu đăng nhập
        if (configDoc.requireLogin && !user_id) {
            return res.json({
                success: true,
                canSpin: false,
                reason: 'login_required',
                message: 'Vui lòng đăng nhập để tham gia quay thưởng.',
            });
        }

        // 5. Kiểm tra Thành viên mới (nếu kích hoạt)
        if (configDoc.onlyNewMembers && user_id) {
            let userObj = await UserModel.findOne({ id: String(user_id) }).lean().catch(() => null);
            if (!userObj) userObj = await UserModel.findById(user_id).lean().catch(() => null);
            if (userObj && userObj.createdAt) {
                const diffDays = (now.getTime() - new Date(userObj.createdAt).getTime()) / (1000 * 3600 * 24);
                if (diffDays > 30) {
                    return res.json({
                        success: true,
                        canSpin: false,
                        reason: 'new_members_only',
                        message: 'Chương trình vòng quay đợt này chỉ áp dụng cho thành viên mới đăng ký trong 30 ngày.',
                    });
                }
            }
        }

        // 6. Kiểm tra giới hạn chu kỳ (daily / weekly / monthly)
        const periodStart = getPeriodStartDate(configDoc.resetInterval);
        const nextReset = new Date(periodStart);
        if (configDoc.resetInterval === 'weekly') nextReset.setDate(nextReset.getDate() + 7);
        else if (configDoc.resetInterval === 'monthly') nextReset.setMonth(nextReset.getMonth() + 1);
        else nextReset.setDate(nextReset.getDate() + 1);
        nextReset.setHours(0, 0, 0, 0);

        // 6.1. Kiểm tra IP Anti-Spam
        if (configDoc.maxSpinsPerIP > 0 && ip) {
            const ipCount = await SpinHistory.countDocuments({
                ip,
                spin_date: { $gte: periodStart }
            });
            if (ipCount >= configDoc.maxSpinsPerIP) {
                return res.json({
                    success: true,
                    canSpin: false,
                    reason: 'ip_limit',
                    message: 'Bạn đã hết lượt quay trong chu kỳ này. Hãy quay lại sau!',
                    nextSpinAt: nextReset.toISOString(),
                });
            }
        }

        // 6.2. Kiểm tra Device Anti-Spam
        if (configDoc.maxSpinsPerDevice > 0 && device) {
            const deviceCount = await SpinHistory.countDocuments({
                device,
                spin_date: { $gte: periodStart }
            });
            if (deviceCount >= configDoc.maxSpinsPerDevice) {
                return res.json({
                    success: true,
                    canSpin: false,
                    reason: 'device_limit',
                    message: 'Bạn đã hết lượt quay trong chu kỳ này. Hãy quay lại sau!',
                    nextSpinAt: nextReset.toISOString(),
                });
            }
        }

        let userSpinsInPeriod = 0;
        let userSpinsTotalMonth = 0;

        if (user_id) {
            const [periodCount, monthCount] = await Promise.all([
                SpinHistory.countDocuments({
                    user_id: String(user_id),
                    spin_date: { $gte: periodStart }
                }),
                SpinHistory.countDocuments({
                    user_id: String(user_id),
                    spin_date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
                })
            ]);
            userSpinsInPeriod = periodCount;
            userSpinsTotalMonth = monthCount;
        }

        // Kiểm tra giới hạn lượt mỗi tài khoản theo tháng
        if (configDoc.maxSpinsPerAccount > 0 && userSpinsTotalMonth >= configDoc.maxSpinsPerAccount) {
            return res.json({
                success: true,
                canSpin: false,
                reason: 'account_limit',
                message: `Bạn đã đạt giới hạn tối đa ${configDoc.maxSpinsPerAccount} lượt quay trong tháng này.`,
            });
        }

        // Kiểm tra lượt quay chu kỳ này
        if (userSpinsInPeriod >= configDoc.spinsPerPeriod) {
            const nextReset = new Date(periodStart);
            if (configDoc.resetInterval === 'weekly') nextReset.setDate(nextReset.getDate() + 7);
            else if (configDoc.resetInterval === 'monthly') nextReset.setMonth(nextReset.getMonth() + 1);
            else nextReset.setDate(nextReset.getDate() + 1);
            nextReset.setHours(0, 0, 0, 0);

            return res.json({
                success: true,
                canSpin: false,
                reason: 'period_limit',
                message: 'Bạn đã hết lượt quay trong chu kỳ này. Hãy quay lại sau!',
                spinsInPeriod: userSpinsInPeriod,
                nextSpinAt: nextReset.toISOString(),
            });
        }

        res.json({
            success: true,
            canSpin: true,
            remainingSpins: Math.max(0, configDoc.spinsPerPeriod - userSpinsInPeriod),
            spinsInPeriod: userSpinsInPeriod,
            showProbability: configDoc.showProbability,
        });
    } catch (error) {
        logger.error('canSpin error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ────────────────────────────────────────────────────────────
// AUTH / PUBLIC: Thực hiện quay thưởng
// POST /api/lucky-wheel/spin
// ────────────────────────────────────────────────────────────
exports.spin = async (req, res) => {
    try {
        const userId = req.user ? String(req.user._id || req.user.id) : (req.body.user_id || req.query.user_id || '');
        const ip     = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
        const device = req.headers['x-device-id'] || req.body?.device_id || (req.headers['user-agent'] || '').substring(0, 200);

        const configDoc = await getOrCreateConfigDoc();
        const now = new Date();

        // 1. Bật / Tắt
        if (!configDoc.isActive) {
            return res.status(400).json({ success: false, message: 'Vòng quay may mắn đang tạm ngưng bảo trì.' });
        }

        // 2. Ngày bắt đầu / kết thúc
        if (configDoc.startDate && now < new Date(configDoc.startDate)) {
            return res.status(400).json({ success: false, message: 'Sự kiện vòng quay chưa bắt đầu.' });
        }
        if (configDoc.endDate && now > new Date(configDoc.endDate)) {
            return res.status(400).json({ success: false, message: 'Sự kiện vòng quay đã kết thúc.' });
        }

        // 3. Yêu cầu đăng nhập
        if (configDoc.requireLogin && !userId) {
            return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để thực hiện quay thưởng.' });
        }

        // 4. Thành viên mới
        if (configDoc.onlyNewMembers && userId) {
            let userObj = await UserModel.findOne({ id: userId }).lean().catch(() => null);
            if (!userObj) userObj = await UserModel.findById(userId).lean().catch(() => null);
            if (userObj && userObj.createdAt) {
                const diffDays = (now.getTime() - new Date(userObj.createdAt).getTime()) / (1000 * 3600 * 24);
                if (diffDays > 30) {
                    return res.status(400).json({ success: false, message: 'Chương trình chỉ áp dụng cho tài khoản thành viên mới.' });
                }
            }
        }

        const periodStart = getPeriodStartDate(configDoc.resetInterval);

        // 5. Kiểm tra Anti-Spam IP
        if (configDoc.maxSpinsPerIP > 0 && ip) {
            const ipCount = await SpinHistory.countDocuments({
                ip,
                spin_date: { $gte: periodStart }
            });
            if (ipCount >= configDoc.maxSpinsPerIP) {
                return res.status(400).json({ success: false, message: `Địa chỉ IP này đã đạt giới hạn tối đa ${configDoc.maxSpinsPerIP} lượt quay trong đợt này.` });
            }
        }

        // 6. Kiểm tra Anti-Spam Device ID
        if (configDoc.maxSpinsPerDevice > 0 && device) {
            const deviceCount = await SpinHistory.countDocuments({
                device,
                spin_date: { $gte: periodStart }
            });
            if (deviceCount >= configDoc.maxSpinsPerDevice) {
                return res.status(400).json({ success: false, message: `Thiết bị này đã đạt giới hạn tối đa ${configDoc.maxSpinsPerDevice} lượt quay trong đợt này.` });
            }
        }

        // 7. Kiểm tra Lượt quay tài khoản
        if (userId) {
            const [periodCount, monthCount] = await Promise.all([
                SpinHistory.countDocuments({ user_id: userId, spin_date: { $gte: periodStart } }),
                SpinHistory.countDocuments({ user_id: userId, spin_date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } })
            ]);

            if (configDoc.maxSpinsPerAccount > 0 && monthCount >= configDoc.maxSpinsPerAccount) {
                return res.status(400).json({ success: false, message: `Bạn đã đạt giới hạn tối đa ${configDoc.maxSpinsPerAccount} lượt quay trong tháng.` });
            }

            if (periodCount >= configDoc.spinsPerPeriod) {
                return res.status(400).json({ success: false, message: 'Bạn đã hết lượt quay trong chu kỳ này.' });
            }
        }

        // 8. Lấy danh sách phần thưởng active
        const prizes = (configDoc.prizes || []).filter(p => p.active !== false);
        if (!prizes.length) {
            return res.status(400).json({ success: false, message: 'Vòng quay chưa được thiết lập phần thưởng.' });
        }

        // 9. Thuật toán weighted random theo probability
        const totalProb = prizes.reduce((sum, p) => sum + (Number(p.probability) || 0), 0);
        let rand = Math.random() * (totalProb || 100);
        let winPrize = prizes[prizes.length - 1]; // fallback

        for (const p of prizes) {
            rand -= (Number(p.probability) || 0);
            if (rand <= 0) {
                winPrize = p;
                break;
            }
        }

        // 10. Tạo UserCoupon nếu trúng thưởng voucher
        let createdCoupon = null;
        if (userId && winPrize.type !== 'none' && winPrize.valid_hours > 0) {
            let couponType = winPrize.type;
            if (couponType === 'discount' || couponType === 'voucher') couponType = 'fixed';
            if (couponType === 'freeship') couponType = 'shipping';

            if (['fixed', 'percent', 'shipping'].includes(couponType)) {
                const uniqueCode = `${winPrize.coupon_code || 'SPIN'}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                try {
                    createdCoupon = await UserCoupon.create({
                        user_id:        userId,
                        reward_name:    winPrize.reward || winPrize.label,
                        coupon_code:    uniqueCode,
                        type:           couponType,
                        discount_value: winPrize.discount_value || 0,
                        expires_at:     new Date(Date.now() + (winPrize.valid_hours || 24) * 3_600_000),
                    });
                } catch (cErr) {
                    logger.error('UserCoupon create error: ' + cErr.message);
                }
            }
        }

        // 11. Lưu SpinHistory
        const spinRecord = await SpinHistory.create({
            user_id:     userId || 'guest',
            reward_id:   winPrize._id || winPrize.id || null,
            reward_text: winPrize.reward || winPrize.label,
            voucher_id:  createdCoupon ? createdCoupon._id : null,
            spin_date:   new Date(),
            ip,
            device,
        });

        if (createdCoupon) {
            await UserCoupon.findByIdAndUpdate(createdCoupon._id, { spin_history_id: spinRecord._id });
        }

        // Tăng UserSpinLimit nếu có userId
        if (userId) {
            const todayStr = toDateStr();
            await UserSpinLimit.findOneAndUpdate(
                { user_id: userId, spin_date: todayStr },
                { $inc: { spin_count: 1 } },
                { upsert: true, new: true }
            );
        }

        res.json({
            success: true,
            prize: {
                _id:            winPrize._id || winPrize.id,
                id:             winPrize.id || winPrize._id,
                label:          winPrize.label || winPrize.reward,
                reward:         winPrize.reward || winPrize.label,
                type:           winPrize.type,
                coupon_code:    winPrize.coupon_code,
                discount_value: winPrize.discount_value,
                probability:    winPrize.probability,
            },
            coupon: createdCoupon,
        });

    } catch (error) {
        logger.error('spin error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN: Cập nhật Cấu hình chung + Danh sách phần thưởng
// PUT /api/lucky-wheel/config
// ────────────────────────────────────────────────────────────
exports.updateConfig = async (req, res) => {
    try {
        const {
            isActive,
            startDate,
            endDate,
            resetInterval,
            spinsPerPeriod,
            maxSpinsPerAccount,
            maxSpinsPerIP,
            maxSpinsPerDevice,
            onlyNewMembers,
            requireLogin,
            showProbability,
            prizes,
        } = req.body;

        let configDoc = await LuckyWheelConfigModel.findOne();
        if (!configDoc) {
            configDoc = new LuckyWheelConfigModel();
        }

        if (typeof isActive === 'boolean')          configDoc.isActive = isActive;
        if (startDate !== undefined)                configDoc.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined)                  configDoc.endDate = endDate ? new Date(endDate) : null;
        if (resetInterval)                          configDoc.resetInterval = resetInterval;
        if (spinsPerPeriod !== undefined)           configDoc.spinsPerPeriod = Number(spinsPerPeriod) || 1;
        if (maxSpinsPerAccount !== undefined)       configDoc.maxSpinsPerAccount = Number(maxSpinsPerAccount) || 0;
        if (maxSpinsPerIP !== undefined)            configDoc.maxSpinsPerIP = Number(maxSpinsPerIP) || 0;
        if (maxSpinsPerDevice !== undefined)        configDoc.maxSpinsPerDevice = Number(maxSpinsPerDevice) || 0;
        if (typeof onlyNewMembers === 'boolean')     configDoc.onlyNewMembers = onlyNewMembers;
        if (typeof requireLogin === 'boolean')        configDoc.requireLogin = requireLogin;
        if (typeof showProbability === 'boolean')     configDoc.showProbability = showProbability;

        if (Array.isArray(prizes)) {
            const normalizeType = (t) => {
                if (!t) return 'none';
                if (t === 'discount' || t === 'voucher') return 'fixed';
                if (t === 'freeship') return 'shipping';
                if (t === 'retry') return 'none';
                return t;
            };

            configDoc.prizes = prizes.map((p, i) => ({
                id:             p.id || p._id || `prize_${i + 1}`,
                label:          p.label || p.reward,
                reward:         p.reward || p.label,
                type:           normalizeType(p.type),
                coupon_code:    p.coupon_code || '',
                discount_value: Number(p.discount_value) || 0,
                probability:    Number(p.probability) || 0,
                valid_hours:    Number(p.valid_hours) || 24,
                quantity:       Number(p.quantity) || 0,
                remaining:      Number(p.remaining) || 0,
                color:          p.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                active:         p.active !== false,
            }));

            // Đồng bộ SpinReward cho tương thích ngược
            await SpinReward.deleteMany({});
            await SpinReward.insertMany(configDoc.prizes.map(p => ({
                reward:         p.reward,
                type:           normalizeType(p.type),
                coupon_code:    p.coupon_code,
                discount_value: p.discount_value,
                probability:    p.probability,
                valid_hours:    p.valid_hours,
                quantity:       p.quantity,
                remaining:      p.remaining,
                color:          p.color,
                active:         p.active,
            })));
        }

        await configDoc.save();

        res.json({
            success: true,
            message: 'Đã lưu cấu hình Vòng quay may mắn thành công.',
            config: configDoc,
        });
    } catch (error) {
        logger.error('updateConfig error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN: Xóa 1 ô phần thưởng
// DELETE /api/lucky-wheel/prize/:id
// ────────────────────────────────────────────────────────────
exports.deletePrize = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, message: 'Thiếu ID phần thưởng' });

        const configDoc = await getOrCreateConfigDoc();
        configDoc.prizes = configDoc.prizes.filter(p => String(p.id) !== String(id) && String(p._id) !== String(id));
        await configDoc.save();

        await SpinReward.findByIdAndDelete(id).catch(() => null);

        res.json({ success: true, message: 'Đã xóa ô phần thưởng thành công!' });
    } catch (error) {
        logger.error('deletePrize error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN: Lịch sử quay đầy đủ
// GET /api/lucky-wheel/history
// ────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
    try {
        const { limit = 20, page = 1, search = '' } = req.query;
        const skip   = (Number(page) - 1) * Number(limit);

        let query = {};
        if (search) {
            query = {
                $or: [
                    { user_id:     { $regex: search, $options: 'i' } },
                    { reward_text: { $regex: search, $options: 'i' } },
                    { ip:          { $regex: search, $options: 'i' } },
                ]
            };
        }

        const [rawHistory, total] = await Promise.all([
            SpinHistory.find(query)
                .sort({ spin_date: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('voucher_id')
                .lean(),
            SpinHistory.countDocuments(query),
        ]);

        const history = await Promise.all(rawHistory.map(async (spin) => {
            let user = null;
            if (spin.user_id && spin.user_id !== 'guest') {
                try {
                    user = await UserModel.findOne({ id: spin.user_id }).select('name email phone id').lean();
                    if (!user) {
                        user = await UserModel.findById(spin.user_id).select('name email phone id').lean().catch(() => null);
                    }
                } catch {}
            }

            const voucher = spin.voucher_id || null;
            let voucherStatus = 'none';
            if (voucher) {
                const now = new Date();
                if (voucher.is_used)                                         voucherStatus = 'used';
                else if (voucher.expires_at && new Date(voucher.expires_at) < now) voucherStatus = 'expired';
                else                                                          voucherStatus = 'unused';
            }

            return {
                _id:            spin._id,
                user_id:        spin.user_id,
                userName:       user?.name  || (spin.user_id === 'guest' ? 'Khách vãng lai' : 'Khách'),
                userEmail:      user?.email || '',
                userPhone:      user?.phone || '',
                spin_date:      spin.spin_date || spin.createdAt,
                reward_text:    spin.reward_text,
                voucherCode:    voucher?.coupon_code    || null,
                voucherType:    voucher?.type           || null,
                voucherValue:   voucher?.discount_value || 0,
                voucherExpiry:  voucher?.expires_at     || null,
                voucherStatus,
                ip:     spin.ip     || '',
                device: spin.device || '',
            };
        }));

        res.json({
            success: true,
            history,
            pagination: {
                page:       Number(page),
                limit:      Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        logger.error('getHistory error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN: Thống kê tổng quan
// GET /api/lucky-wheel/stats
// ────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
    try {
        const now = new Date();

        const [
            totalSpins,
            totalVouchers,
            usedVouchers,
            expiredVouchers,
            unusedVouchers,
            rewardBreakdown,
        ] = await Promise.all([
            SpinHistory.countDocuments(),
            UserCoupon.countDocuments(),
            UserCoupon.countDocuments({ is_used: true }),
            UserCoupon.countDocuments({ is_used: false, expires_at: { $lt: now } }),
            UserCoupon.countDocuments({ is_used: false, expires_at: { $gte: now } }),
            SpinHistory.aggregate([
                { $group: { _id: '$reward_text', count: { $sum: 1 } } },
                { $sort:  { count: -1 } },
                { $limit: 10 },
            ]),
        ]);

        res.json({
            success: true,
            stats: {
                totalSpins,
                totalVouchers,
                usedVouchers,
                expiredVouchers,
                unusedVouchers,
            },
            rewardBreakdown: rewardBreakdown.map(r => ({
                reward: r._id,
                count:  r.count,
            })),
        });
    } catch (error) {
        logger.error('getStats error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
