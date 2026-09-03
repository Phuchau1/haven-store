/**
 * ============================================================
 * CONTROLLER: ĐIỂM TÍCH LŨY (Loyalty Points)
 * Mô tả: Xử lý các API liên quan đến tích điểm, đổi điểm,
 *        và leaderboard khách hàng thân thiết.
 *
 * Quy tắc tích điểm:
 *   - 1 điểm = 1.000 VNĐ chi tiêu
 *   - Điểm được cộng ngay khi tạo đơn thành công (pending)
 *   - Điểm bị thu hồi nếu đơn bị hủy
 *
 * Quy tắc đổi điểm:
 *   - 100 điểm = 10.000 VNĐ voucher
 *   - Tối thiểu đổi 100 điểm
 * ============================================================
 */
const { LoyaltyPointsModel }     = require('../models/LoyaltyPoints');
const { LoyaltyTransactionModel } = require('../models/LoyaltyTransaction');
const { UserModel }               = require('../models/User');
const UserCoupon                  = require('../models/UserCoupon');

// Hệ số tích điểm: 1 điểm / 1.000 VNĐ
const POINTS_PER_1000_VND = 1;
// Hệ số đổi điểm: 100 điểm = 10.000 VNĐ
const REDEEM_RATE = { points: 100, value: 10000 };

// Thông tin cấp độ
const LEVEL_INFO = {
    Bronze:   { min: 0,     max: 999,   next: 'Silver',   nextThreshold: 1000,  badge: '🥉', label: 'Hạng Đồng', discount: '0%' },
    Silver:   { min: 1000,  max: 4999,  next: 'Gold',     nextThreshold: 5000,  badge: '🥈', label: 'Hạng Bạc', discount: 'Giảm 3%' },
    Gold:     { min: 5000,  max: 19999, next: 'Platinum', nextThreshold: 20000, badge: '🥇', label: 'Hạng Vàng', discount: 'Giảm 5% + FreeShip' },
    Platinum: { min: 20000, max: null,  next: null,       nextThreshold: null,  badge: '💎', label: 'Hạng Kim Cương', discount: 'Giảm 10% + Quà VIP' },
};

/**
 * Tính số điểm được cộng từ số tiền đơn hàng
 * @param {Number} amount - Số tiền VNĐ
 * @returns {Number} Điểm được cộng
 */
const calculateEarnedPoints = (amount) => {
    return Math.floor(amount / 1000) * POINTS_PER_1000_VND;
};

/**
 * @desc  Cộng điểm tích lũy cho người dùng sau khi đặt hàng hoặc sự kiện
 * @param {String} userId   - ID người dùng
 * @param {Number} amount   - Số tiền đơn hàng (finalAmount) hoặc giá trị quy đổi
 * @param {String} orderId  - Mã đơn hàng hoặc mã sự kiện
 * @param {String} customType - 'earn' | 'bonus'
 * @param {String} customDesc - Mô tả tùy chỉnh
 */
const earnPoints = async (userId, amount, orderId, customType = 'earn', customDesc = null) => {
    if (!userId) return null;

    const pointsToAdd = customType === 'bonus' ? Number(amount) : calculateEarnedPoints(amount);
    if (pointsToAdd <= 0) return null;

    let loyalty = await LoyaltyPointsModel.findOne({ userId });
    if (!loyalty) {
        loyalty = new LoyaltyPointsModel({ userId, points: 0, totalEarned: 0, totalSpent: 0 });
    }

    const balanceBefore = loyalty.points;

    // Cộng điểm
    loyalty.points      += pointsToAdd;
    loyalty.totalEarned += pointsToAdd;
    loyalty.level        = loyalty.calculateLevel();
    await loyalty.save();

    // Ghi lịch sử giao dịch
    const description = customDesc || (orderId ? `Tích điểm từ Đơn hàng #${orderId} (${amount.toLocaleString('vi-VN')}đ)` : `Thưởng +${pointsToAdd} điểm`);
    await LoyaltyTransactionModel.create({
        userId,
        type:          customType,
        points:        pointsToAdd,
        orderId:       orderId || null,
        description,
        balanceBefore,
        balanceAfter:  loyalty.points,
    });

    return loyalty;
};

/**
 * @desc  Thu hồi điểm khi đơn hàng bị hủy hoặc hoàn tiền
 * @param {String} userId   - ID người dùng
 * @param {String} orderId  - Mã đơn hàng bị hủy
 */
const revokePoints = async (userId, orderId) => {
    if (!userId) return;

    // Tìm giao dịch earn gốc của đơn hàng này
    const earnTx = await LoyaltyTransactionModel.findOne({ userId, orderId, type: 'earn' });
    if (!earnTx) return;

    const loyalty = await LoyaltyPointsModel.findOne({ userId });
    if (!loyalty) return;

    const pointsToRevoke = earnTx.points;
    const balanceBefore  = loyalty.points;

    // Trừ điểm (không để âm)
    loyalty.points      = Math.max(0, loyalty.points - pointsToRevoke);
    loyalty.totalEarned = Math.max(0, loyalty.totalEarned - pointsToRevoke);
    loyalty.level       = loyalty.calculateLevel();
    await loyalty.save();

    // Ghi lịch sử thu hồi
    await LoyaltyTransactionModel.create({
        userId,
        type:          'expire',
        points:        -pointsToRevoke,
        orderId,
        description:   `Thu hồi điểm do Đơn hàng #${orderId} bị hủy hoặc hoàn trả`,
        balanceBefore,
        balanceAfter:  loyalty.points,
    });
};

/**
 * @desc    Xem điểm hiện tại, cấp bậc, tiến trình và lịch sử giao dịch
 * @route   GET /api/loyalty/me
 * @access  Private (User)
 */
const getMyPoints = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
        }

        // Lấy hoặc tạo mới bản ghi điểm
        let loyalty = await LoyaltyPointsModel.findOne({ userId }).lean();
        if (!loyalty) {
            loyalty = { userId, points: 0, level: 'Bronze', totalEarned: 0, totalSpent: 0 };
        }

        // Lấy 30 giao dịch gần nhất
        const transactions = await LoyaltyTransactionModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        // Thông tin cấp độ hiện tại & kế tiếp
        const levelInfo = LEVEL_INFO[loyalty.level] || LEVEL_INFO.Bronze;
        const currentTierMin = levelInfo.min;
        const nextThreshold = levelInfo.nextThreshold || 20000;
        const pointsToNextLevel = levelInfo.nextThreshold
            ? Math.max(0, levelInfo.nextThreshold - (loyalty.totalEarned || 0))
            : 0;

        // Tính % tiến trình lên hạng
        let progressPercent = 100;
        if (levelInfo.nextThreshold) {
            const range = levelInfo.nextThreshold - currentTierMin;
            const progress = (loyalty.totalEarned || 0) - currentTierMin;
            progressPercent = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
        }

        return res.json({
            success: true,
            loyalty: {
                ...loyalty,
                levelLabel:       levelInfo.label,
                levelBadge:       levelInfo.badge,
                levelDiscount:    levelInfo.discount,
                progressPercent,
                pointsToNextLevel,
                nextLevel:        levelInfo.next,
                nextLevelBadge:   levelInfo.next ? LEVEL_INFO[levelInfo.next]?.badge : null,
                redeemRate:       REDEEM_RATE,
                estimatedVoucherValue: Math.floor((loyalty.points || 0) / REDEEM_RATE.points) * REDEEM_RATE.value,
            },
            levelTiers: LEVEL_INFO,
            transactions,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Đổi điểm lấy Voucher và tự động lưu vào Ví Voucher cá nhân
 * @route   POST /api/loyalty/redeem
 * @body    { userId, pointsToRedeem }
 * @access  Private (User)
 */
const redeemPoints = async (req, res, next) => {
    try {
        const userId = req.body.userId || req.headers['x-user-id'];
        const { pointsToRedeem } = req.body;
        if (!userId || !pointsToRedeem) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin người dùng hoặc số điểm muốn đổi.' });
        }

        const points = parseInt(pointsToRedeem, 10);
        if (isNaN(points) || points <= 0) {
            return res.status(400).json({ success: false, message: 'Số điểm không hợp lệ.' });
        }

        if (points < REDEEM_RATE.points) {
            return res.status(400).json({
                success: false,
                message: `Số điểm tối thiểu để đổi là ${REDEEM_RATE.points} điểm.`
            });
        }

        if (points % REDEEM_RATE.points !== 0) {
            return res.status(400).json({
                success: false,
                message: `Số điểm phải là bội số của ${REDEEM_RATE.points}.`
            });
        }

        const loyalty = await LoyaltyPointsModel.findOne({ userId });
        if (!loyalty || loyalty.points < points) {
            return res.status(400).json({ success: false, message: 'Số dư điểm không đủ để thực hiện đổi thưởng.' });
        }

        const voucherValue   = (points / REDEEM_RATE.points) * REDEEM_RATE.value;
        const balanceBefore  = loyalty.points;

        // 1. Trừ điểm & cập nhật
        loyalty.points     -= points;
        loyalty.totalSpent += points;
        await loyalty.save();

        // 2. Tạo mã Voucher ngẫu nhiên duy nhất
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const voucherCode = `HV${Math.round(voucherValue / 1000)}K-${randomSuffix}`;
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày sử dụng

        // 3. Lưu vào UserCoupon (Ví Voucher của User)
        const newCoupon = await UserCoupon.create({
            user_id:        String(userId),
            reward_name:    `Voucher ${voucherValue.toLocaleString('vi-VN')}đ (Đổi từ ${points} điểm HAVEN)`,
            coupon_code:    voucherCode,
            type:           'fixed',
            discount_value: voucherValue,
            expires_at:     expiresAt,
            is_used:        false
        });

        // 4. Ghi sổ cái giao dịch
        await LoyaltyTransactionModel.create({
            userId,
            type:          'redeem',
            points:        -points,
            orderId:       null,
            description:   `Đổi ${points} điểm nhận Mã Voucher: ${voucherCode} (-${voucherValue.toLocaleString('vi-VN')}đ)`,
            balanceBefore,
            balanceAfter:  loyalty.points,
        });

        return res.json({
            success:         true,
            message:         `🎉 Đổi thành công! Bạn nhận được Voucher ${voucherValue.toLocaleString('vi-VN')}đ (Mã: ${voucherCode}). Đã lưu vào Ví Voucher của bạn!`,
            voucher: {
                code: voucherCode,
                value: voucherValue,
                expiresAt
            },
            remainingPoints: loyalty.points,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bảng xếp hạng khách hàng thân thiết (Top 20)
 * @route   GET /api/loyalty/leaderboard
 */
const getLeaderboard = async (req, res, next) => {
    try {
        const leaderboard = await LoyaltyPointsModel
            .find({})
            .sort({ totalEarned: -1 })
            .limit(20)
            .lean();

        const enriched = await Promise.all(
            leaderboard.map(async (entry, index) => {
                const user = await UserModel.findOne({ 
                    $or: [{ id: entry.userId }, { _id: entry.userId }] 
                }, 'name email avatar phone').lean().catch(() => null);

                return {
                    rank:       index + 1,
                    ...entry,
                    levelBadge: (LEVEL_INFO[entry.level] || LEVEL_INFO.Bronze).badge,
                    levelLabel: (LEVEL_INFO[entry.level] || LEVEL_INFO.Bronze).label,
                    userName:   user?.name   || 'Khách hàng thân thiết',
                    userEmail:  user?.email  || '',
                    userPhone:  user?.phone  || '',
                    userAvatar: user?.avatar || null,
                };
            })
        );

        return res.json({ success: true, leaderboard: enriched });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Thống kê tổng quan Điểm thưởng cho Admin Dashboard
 * @route   GET /api/loyalty/admin/stats
 * @access  Admin
 */
const getLoyaltyStats = async (req, res, next) => {
    try {
        const allRecords = await LoyaltyPointsModel.find({}).lean();
        
        let totalCirculated = 0;
        let totalEarned = 0;
        let totalSpent = 0;
        const tierCounts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };

        allRecords.forEach(r => {
            totalCirculated += (r.points || 0);
            totalEarned     += (r.totalEarned || 0);
            totalSpent      += (r.totalSpent || 0);
            if (tierCounts[r.level] !== undefined) {
                tierCounts[r.level]++;
            } else {
                tierCounts.Bronze++;
            }
        });

        const recentTransactions = await LoyaltyTransactionModel
            .find({})
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();

        res.json({
            success: true,
            stats: {
                totalMembers: allRecords.length,
                totalCirculated,
                totalEarned,
                totalSpent,
                tierCounts
            },
            recentTransactions
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Admin cộng/trừ điểm thưởng thủ công cho người dùng kèm lý do ghi sổ cái
 * @route   POST /api/loyalty/admin/adjust
 * @access  Admin
 */
const adminAdjustPoints = async (req, res, next) => {
    try {
        const { userId, points, reason, adminName } = req.body;
        if (!userId || points === undefined || points === 0) {
            return res.status(400).json({ success: false, message: 'Cần cung cấp userId và số điểm cần điều chỉnh (khác 0)' });
        }

        const pts = parseInt(points, 10);
        let loyalty = await LoyaltyPointsModel.findOne({ userId });
        if (!loyalty) {
            loyalty = new LoyaltyPointsModel({ userId, points: 0, totalEarned: 0, totalSpent: 0 });
        }

        const balanceBefore = loyalty.points;
        loyalty.points = Math.max(0, loyalty.points + pts);
        if (pts > 0) {
            loyalty.totalEarned += pts;
        }
        loyalty.level = loyalty.calculateLevel();
        await loyalty.save();

        await LoyaltyTransactionModel.create({
            userId,
            type:         'admin_adjust',
            points:       pts,
            orderId:      null,
            description:  reason ? `[Admin: ${adminName || 'Quản trị viên'}] ${reason}` : `Điều chỉnh bởi Admin: ${pts > 0 ? '+' : ''}${pts} điểm`,
            balanceBefore,
            balanceAfter: loyalty.points,
        });

        res.json({
            success: true,
            message: `Đã ${pts > 0 ? 'cộng' : 'trừ'} ${Math.abs(pts)} điểm cho khách hàng thành công. Số dư mới: ${loyalty.points} điểm.`,
            loyalty
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    getMyPoints, 
    redeemPoints, 
    getLeaderboard, 
    getLoyaltyStats,
    adminAdjustPoints,
    earnPoints, 
    revokePoints 
};
