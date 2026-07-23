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

// Hệ số tích điểm: 1 điểm / 1.000 VNĐ
const POINTS_PER_1000_VND = 1;
// Hệ số đổi điểm: 100 điểm = 10.000 VNĐ
const REDEEM_RATE = { points: 100, value: 10000 };

// Thông tin cấp độ
const LEVEL_INFO = {
    Bronze:   { min: 0,     max: 999,   next: 'Silver',   nextThreshold: 1000,  badge: '🥉' },
    Silver:   { min: 1000,  max: 4999,  next: 'Gold',     nextThreshold: 5000,  badge: '🥈' },
    Gold:     { min: 5000,  max: 19999, next: 'Platinum', nextThreshold: 20000, badge: '🥇' },
    Platinum: { min: 20000, max: null,  next: null,       nextThreshold: null,  badge: '💎' },
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
 * @desc  Cộng điểm tích lũy cho người dùng sau khi đặt hàng
 *        Hàm này được gọi từ orderController (không phải HTTP handler)
 * @param {String} userId   - ID người dùng
 * @param {Number} amount   - Số tiền đơn hàng (finalAmount)
 * @param {String} orderId  - Mã đơn hàng
 * @returns {Object|null}   - Bản ghi LoyaltyPoints đã cập nhật
 */
const earnPoints = async (userId, amount, orderId) => {
    if (!userId) return null;

    const pointsToAdd = calculateEarnedPoints(amount);
    if (pointsToAdd <= 0) return null;

    // Tìm hoặc tạo mới bản ghi điểm cho user
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
    await LoyaltyTransactionModel.create({
        userId,
        type:          'earn',
        points:        pointsToAdd,
        orderId,
        description:   `Tích điểm từ Đơn hàng #${orderId} (${amount.toLocaleString('vi-VN')}đ)`,
        balanceBefore,
        balanceAfter:  loyalty.points,
    });

    return loyalty;
};

/**
 * @desc  Thu hồi điểm khi đơn hàng bị hủy
 *        Hàm này được gọi từ orderController (không phải HTTP handler)
 * @param {String} userId   - ID người dùng
 * @param {String} orderId  - Mã đơn hàng bị hủy
 */
const revokePoints = async (userId, orderId) => {
    if (!userId) return;

    // Tìm giao dịch earn gốc của đơn hàng này
    const earnTx = await LoyaltyTransactionModel.findOne({ userId, orderId, type: 'earn' });
    if (!earnTx) return; // Chưa từng cộng điểm → bỏ qua

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
        description:   `Thu hồi điểm do hủy Đơn hàng #${orderId}`,
        balanceBefore,
        balanceAfter:  loyalty.points,
    });
};

/**
 * @desc    Xem điểm hiện tại và lịch sử giao dịch của mình
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

        // Lấy 20 giao dịch gần nhất
        const transactions = await LoyaltyTransactionModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        // Thông tin cấp độ tiếp theo
        const levelInfo = LEVEL_INFO[loyalty.level] || LEVEL_INFO.Bronze;
        const pointsToNextLevel = levelInfo.nextThreshold
            ? Math.max(0, levelInfo.nextThreshold - (loyalty.totalEarned || 0))
            : 0;

        return res.json({
            success: true,
            loyalty: {
                ...loyalty,
                levelBadge:       levelInfo.badge,
                pointsToNextLevel,
                nextLevel:        levelInfo.next,
                redeemRate:       REDEEM_RATE,
                // Quy đổi số điểm hiện tại ra VNĐ
                estimatedVoucherValue: Math.floor(loyalty.points / REDEEM_RATE.points) * REDEEM_RATE.value,
            },
            transactions,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Đổi điểm lấy voucher giảm giá
 * @route   POST /api/loyalty/redeem
 * @body    { userId, pointsToRedeem }
 * @access  Private (User)
 */
const redeemPoints = async (req, res, next) => {
    try {
        const { userId, pointsToRedeem } = req.body;
        if (!userId || !pointsToRedeem) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin.' });
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
            return res.status(400).json({ success: false, message: 'Không đủ điểm để đổi.' });
        }

        const voucherValue   = (points / REDEEM_RATE.points) * REDEEM_RATE.value;
        const balanceBefore  = loyalty.points;

        // Trừ điểm
        loyalty.points     -= points;
        loyalty.totalSpent += points;
        await loyalty.save();

        // Ghi lịch sử
        await LoyaltyTransactionModel.create({
            userId,
            type:          'redeem',
            points:        -points,
            orderId:       null,
            description:   `Đổi ${points} điểm lấy voucher ${voucherValue.toLocaleString('vi-VN')}đ`,
            balanceBefore,
            balanceAfter:  loyalty.points,
        });

        return res.json({
            success:         true,
            message:         `Đổi thành công! Bạn nhận được voucher trị giá ${voucherValue.toLocaleString('vi-VN')}đ`,
            voucherValue,
            remainingPoints: loyalty.points,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bảng xếp hạng khách hàng thân thiết (Top 20)
 * @route   GET /api/loyalty/leaderboard
 * @access  Private (Admin)
 */
const getLeaderboard = async (req, res, next) => {
    try {
        const leaderboard = await LoyaltyPointsModel
            .find({})
            .sort({ totalEarned: -1 })
            .limit(20)
            .lean();

        // Enrich với tên user
        const enriched = await Promise.all(
            leaderboard.map(async (entry, index) => {
                const user = await UserModel.findOne({ id: entry.userId }, 'name email avatar').lean();
                return {
                    rank:       index + 1,
                    ...entry,
                    levelBadge: (LEVEL_INFO[entry.level] || LEVEL_INFO.Bronze).badge,
                    userName:   user?.name   || 'Khách hàng',
                    userEmail:  user?.email  || '',
                    userAvatar: user?.avatar || null,
                };
            })
        );

        return res.json({ success: true, leaderboard: enriched });
    } catch (error) {
        next(error);
    }
};

module.exports = { getMyPoints, redeemPoints, getLeaderboard, earnPoints, revokePoints };
