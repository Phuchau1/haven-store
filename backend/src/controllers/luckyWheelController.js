/**
 * ============================================================
 * CONTROLLER: VÒNG QUAY MAY MẮN (Lucky Wheel)
 * Mô tả: Quản lý logic cho trò chơi vòng quay may mắn.
 *        - Thuật toán quay theo tỷ lệ xác suất
 *        - UserSpinLimit: giới hạn lượt quay theo ngày
 *        - Lưu ip/device để chống lạm dụng
 *        - Liên kết trực tiếp SpinHistory ↔ UserCoupon qua voucher_id
 *        - Admin: thống kê đầy đủ
 * ============================================================
 */
const SpinReward    = require('../models/SpinReward');
const SpinHistory   = require('../models/SpinHistory');
const UserCoupon    = require('../models/UserCoupon');
const UserSpinLimit = require('../models/UserSpinLimit');
const logger        = require('../utils/logger');

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Format ngày thành 'YYYY-MM-DD' (múi giờ local server) */
const toDateStr = (d = new Date()) => d.toISOString().split('T')[0];

/**
 * Khởi tạo dữ liệu mẫu nếu chưa có phần thưởng trong DB.
 * probability = tỷ lệ phần trăm. Tổng không nhất thiết phải = 100.
 */
const initDefaultRewards = async () => {
    const count = await SpinReward.countDocuments();
    if (count === 0) {
        await SpinReward.insertMany([
            { reward: 'Chúc bạn may mắn lần sau', type: 'none',     coupon_code: '',         discount_value: 0,      probability: 60,  valid_hours: 0,  active: true },
            { reward: 'Giảm 20.000đ',              type: 'fixed',    coupon_code: 'SPIN20',   discount_value: 20000,  probability: 15,  valid_hours: 24, active: true },
            { reward: 'Giảm 30.000đ',              type: 'fixed',    coupon_code: 'SPIN30',   discount_value: 30000,  probability: 10,  valid_hours: 24, active: true },
            { reward: 'Giảm 50.000đ',              type: 'fixed',    coupon_code: 'SPIN50',   discount_value: 50000,  probability: 6,   valid_hours: 24, active: true },
            { reward: 'Freeship',                  type: 'shipping', coupon_code: 'FREESHIP', discount_value: 30000,  probability: 5,   valid_hours: 24, active: true },
            { reward: 'Giảm 100.000đ',             type: 'fixed',    coupon_code: 'SPIN100',  discount_value: 100000, probability: 2,   valid_hours: 24, active: true },
            { reward: 'Giảm 15%',                  type: 'percent',  coupon_code: 'SPIN15P',  discount_value: 15,     probability: 1.5, valid_hours: 24, active: true },
            { reward: 'Giảm 20%',                  type: 'percent',  coupon_code: 'SPIN20P',  discount_value: 20,     probability: 0.5, valid_hours: 24, active: true },
        ]);
    }
};

// ────────────────────────────────────────────────────────────
// PUBLIC: Lấy cấu hình vòng quay (prizes + config)
// ────────────────────────────────────────────────────────────
exports.getConfig = async (req, res) => {
    try {
        await initDefaultRewards();
        const rewards = await SpinReward.find({ active: true });

        const COLORS = ['#E53E3E','#ED8936','#38A169','#3182CE','#D69E2E','#805AD5','#DD6B20','#319795'];

        const config = {
            isActive: true,
            spinsPerDay: 1,
            prizes: rewards.map((r, i) => ({
                id:             r._id.toString(),
                _id:            r._id.toString(),
                label:          r.reward,
                reward:         r.reward,
                type:           r.type,
                coupon_code:    r.coupon_code,
                discount_value: r.discount_value,
                probability:    r.probability,
                valid_hours:    r.valid_hours,
                quantity:       r.quantity,
                remaining:      r.remaining,
                color:          r.color || COLORS[i % COLORS.length],
                active:         r.active,
                value: r.type === 'fixed'    ? `${r.discount_value / 1000}K`
                     : r.type === 'percent'  ? `${r.discount_value}%`
                     : r.type === 'shipping' ? 'Freeship'
                     : '-',
            }))
        };

        res.json({ success: true, prizes: rewards, config });
    } catch (error) {
        logger.error('getConfig error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ────────────────────────────────────────────────────────────
// PUBLIC: Kiểm tra user còn lượt quay không
// GET /api/lucky-wheel/can-spin?user_id=xxx
// ────────────────────────────────────────────────────────────
exports.canSpin = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });

        const today = toDateStr();
        const limit = await UserSpinLimit.findOne({ user_id: String(user_id), spin_date: today });
        const spinsToday = limit ? limit.spin_count : 0;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        res.json({
            success:     true,
            canSpin:     spinsToday < 1,
            spinsToday,
            nextSpinAt:  spinsToday >= 1 ? tomorrow.toISOString() : null,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ────────────────────────────────────────────────────────────
// AUTH: Quay vòng (1 lần/ngày/user)
// POST /api/lucky-wheel/spin
// ────────────────────────────────────────────────────────────
exports.spin = async (req, res) => {
    try {
        const userId = String(req.user._id || req.user.id);
        const today  = toDateStr();

        // 1. Kiểm tra giới hạn lượt quay (dùng UserSpinLimit – nhanh & chính xác)
        const spinLimit = await UserSpinLimit.findOne({ user_id: userId, spin_date: today });
        if (spinLimit && spinLimit.spin_count >= 1) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return res.status(400).json({
                success:   false,
                message:   'Bạn đã hết lượt quay hôm nay. Vui lòng quay lại vào ngày mai!',
                nextSpinAt: tomorrow.toISOString(),
            });
        }

        // 2. Lấy danh sách phần thưởng
        const rewards = await SpinReward.find({ active: true });
        if (!rewards.length) {
            return res.status(400).json({ success: false, message: 'Vòng quay chưa được cấu hình.' });
        }

        // 3. Thuật toán weighted random theo probability
        const totalProb = rewards.reduce((s, p) => s + p.probability, 0);
        let rand = Math.random() * totalProb;
        let winPrize = rewards[rewards.length - 1]; // fallback
        for (const p of rewards) {
            rand -= p.probability;
            if (rand <= 0) { winPrize = p; break; }
        }

        // 4. Lấy IP & device từ request
        const ip     = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
        const device = (req.headers['user-agent'] || '').substring(0, 200);

        // 5. Tạo UserCoupon nếu có giải
        let createdCoupon = null;
        if (winPrize.type !== 'none' && winPrize.valid_hours > 0) {
            const uniqueCode = `${winPrize.coupon_code}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            createdCoupon = await UserCoupon.create({
                user_id:        userId,
                reward_name:    winPrize.reward,
                coupon_code:    uniqueCode,
                type:           winPrize.type,
                discount_value: winPrize.discount_value,
                expires_at:     new Date(Date.now() + winPrize.valid_hours * 3_600_000),
            });
        }

        // 6. Lưu SpinHistory (liên kết trực tiếp voucher_id)
        const spinRecord = await SpinHistory.create({
            user_id:     userId,
            reward_id:   winPrize._id,
            reward_text: winPrize.reward,
            voucher_id:  createdCoupon ? createdCoupon._id : null,
            spin_date:   new Date(),
            ip,
            device,
        });

        // Gắn spin_history_id ngược lại vào voucher
        if (createdCoupon) {
            await UserCoupon.findByIdAndUpdate(createdCoupon._id, { spin_history_id: spinRecord._id });
        }

        // 7. Upsert UserSpinLimit (tăng spin_count)
        await UserSpinLimit.findOneAndUpdate(
            { user_id: userId, spin_date: today },
            { $inc: { spin_count: 1 } },
            { upsert: true, new: true }
        );

        // 8. Response
        res.json({
            success: true,
            prize: {
                _id:            winPrize._id.toString(),
                id:             winPrize._id.toString(),
                reward:         winPrize.reward,
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
// ADMIN: Cập nhật cấu hình phần thưởng
// PUT /api/lucky-wheel/config
// ────────────────────────────────────────────────────────────
exports.updateConfig = async (req, res) => {
    try {
        const { prizes } = req.body;

        if (!prizes || !Array.isArray(prizes) || prizes.length === 0) {
            await SpinReward.deleteMany({});
            await initDefaultRewards();
            return res.json({ success: true, message: 'Đã reset về cấu hình mặc định.' });
        }

        const submittedIds = prizes.map(p => p._id || p.id).filter(id => id && id.length === 24);
        if (submittedIds.length > 0) {
            await SpinReward.deleteMany({ _id: { $nin: submittedIds } });
        }

        const ops = prizes.map(p => {
            const idStr = p._id || p.id;
            const data  = {
                reward:         p.reward || p.label,
                type:           p.type,
                coupon_code:    p.coupon_code || '',
                discount_value: Number(p.discount_value) || 0,
                probability:    Number(p.probability) || 0,
                valid_hours:    Number(p.valid_hours) || 24,
                quantity:       Number(p.quantity) || 0,
                remaining:      Number(p.remaining) || 0,
                color:          p.color || '',
                active:         p.active !== false,
            };
            if (idStr && idStr.length === 24) {
                return SpinReward.findByIdAndUpdate(idStr, data, { new: true });
            }
            return SpinReward.create(data);
        });

        await Promise.all(ops);
        res.json({ success: true, message: 'Đã lưu cấu hình vòng quay thành công.' });
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
        await SpinReward.findByIdAndDelete(id);
        res.json({ success: true, message: 'Đã xóa ô phần thưởng thành công!' });
    } catch (error) {
        logger.error('deletePrize error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN: Lịch sử quay đầy đủ (12 trường)
// GET /api/lucky-wheel/history?page=1&limit=20&search=xxx
// ────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
    try {
        const { limit = 20, page = 1, search = '' } = req.query;
        const skip   = (Number(page) - 1) * Number(limit);

        const { UserModel } = require('../models/User');

        // Nếu có từ khóa tìm kiếm → lọc theo user_id hoặc reward_text
        let query = {};
        if (search) {
            query = {
                $or: [
                    { user_id:     { $regex: search, $options: 'i' } },
                    { reward_text: { $regex: search, $options: 'i' } },
                ]
            };
        }

        const [rawHistory, total] = await Promise.all([
            SpinHistory.find(query)
                .sort({ spin_date: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('voucher_id')   // ← join trực tiếp, không tìm theo time range
                .lean(),
            SpinHistory.countDocuments(query),
        ]);

        const today = toDateStr();

        // Enrich mỗi record với thông tin User + lượt còn lại
        const history = await Promise.all(rawHistory.map(async (spin) => {
            // Lấy thông tin user
            let user = null;
            try {
                user = await UserModel.findOne({ id: spin.user_id })
                    .select('name email phone id').lean();
                if (!user) {
                    user = await UserModel.findById(spin.user_id)
                        .select('name email phone id').lean().catch(() => null);
                }
            } catch {}

            // Lấy voucher từ populate
            const voucher = spin.voucher_id || null;

            // Trạng thái voucher
            let voucherStatus = 'none';
            if (voucher) {
                const now = new Date();
                if (voucher.is_used)                                         voucherStatus = 'used';
                else if (voucher.expires_at && new Date(voucher.expires_at) < now) voucherStatus = 'expired';
                else                                                          voucherStatus = 'unused';
            }

            // Lượt quay còn lại hôm nay của user này
            const spinLimitDoc = await UserSpinLimit.findOne({ user_id: String(spin.user_id), spin_date: today });
            const spinsToday   = spinLimitDoc ? spinLimitDoc.spin_count : 0;
            const remainingSpins = Math.max(0, 1 - spinsToday);

            return {
                _id:            spin._id,
                user_id:        spin.user_id,
                userName:       user?.name  || 'Khách',
                userEmail:      user?.email || '',
                userPhone:      user?.phone || '',
                spin_date:      spin.spin_date || spin.createdAt,
                reward_text:    spin.reward_text,
                voucherCode:    voucher?.coupon_code    || null,
                voucherType:    voucher?.type           || null,
                voucherValue:   voucher?.discount_value || 0,
                voucherExpiry:  voucher?.expires_at     || null,
                voucherStatus,                        // none | unused | used | expired
                remainingSpins,
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
// ADMIN: Thống kê tổng quan vòng quay
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
            // Top phần thưởng
            SpinHistory.aggregate([
                { $group: { _id: '$reward_text', count: { $sum: 1 } } },
                { $sort:  { count: -1 } },
                { $limit: 8 },
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
