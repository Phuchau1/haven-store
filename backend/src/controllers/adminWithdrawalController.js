const { WithdrawalRequestModel } = require('../models/WithdrawalRequest');
const { UserModel } = require('../models/User');
const { WalletTransactionModel } = require('../models/WalletTransaction');

/**
 * @desc Lấy danh sách tất cả yêu cầu rút tiền (Admin)
 * @route GET /api/admin/withdrawals
 * @access Private/Admin
 */
const getAllWithdrawals = async (req, res, next) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        if (search) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { id: regex },
                { userEmail: regex },
                { userName: regex },
                { 'bankInfo.accountNumber': regex },
                { 'bankInfo.accountHolder': regex }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await WithdrawalRequestModel.countDocuments(query);
        const withdrawals = await WithdrawalRequestModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        // Thống kê tổng quan
        const stats = await WithdrawalRequestModel.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const summary = {
            pending: { count: 0, amount: 0 },
            completed: { count: 0, amount: 0 },
            rejected: { count: 0, amount: 0 },
            totalAmountPending: 0
        };

        stats.forEach(s => {
            if (summary[s._id]) {
                summary[s._id].count = s.count;
                summary[s._id].amount = s.totalAmount;
            }
        });

        res.json({
            success: true,
            withdrawals,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            },
            summary
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Duyệt yêu cầu rút tiền (Admin xác nhận đã chuyển khoản thành công)
 * @route POST /api/admin/withdrawals/:id/approve
 * @access Private/Admin
 */
const approveWithdrawal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { adminNote, proofImage } = req.body;
        const adminId = req.user?.id || req.user?.email || 'admin';

        const withdrawal = await WithdrawalRequestModel.findOne({ id });
        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu rút tiền' });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Yêu cầu này đã ở trạng thái [${withdrawal.status}], không thể duyệt lại.`
            });
        }

        withdrawal.status = 'completed';
        withdrawal.adminNote = adminNote || 'Đã chuyển khoản thành công qua ngân hàng';
        withdrawal.proofImage = proofImage || '';
        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        // Cập nhật trạng thái WalletTransaction tương ứng sang completed
        await WalletTransactionModel.findOneAndUpdate(
            { withdrawalRequestId: id },
            { $set: { status: 'completed', description: `Đã rút tiền về ${withdrawal.bankInfo.bankName} (${withdrawal.bankInfo.accountNumber}) thành công` } }
        );

        res.json({
            success: true,
            message: `Duyệt thành công yêu cầu rút ${withdrawal.amount.toLocaleString('vi-VN')} đ cho ${withdrawal.userName || withdrawal.userEmail}`,
            withdrawal
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Từ chối yêu cầu rút tiền & Tự động HOÀN TRẢ LẠI TIỀN VÀO VÍ User
 * @route POST /api/admin/withdrawals/:id/reject
 * @access Private/Admin
 */
const rejectWithdrawal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { adminNote } = req.body;
        const adminId = req.user?.id || req.user?.email || 'admin';

        if (!adminNote) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do từ chối yêu cầu rút tiền' });
        }

        const withdrawal = await WithdrawalRequestModel.findOne({ id });
        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu rút tiền' });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Yêu cầu này đã ở trạng thái [${withdrawal.status}], không thể từ chối.`
            });
        }

        // 1. Cập nhật trạng thái WithdrawalRequest
        withdrawal.status = 'rejected';
        withdrawal.adminNote = adminNote;
        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        // 2. Cập nhật transaction rút tiền cũ thành 'failed'
        await WalletTransactionModel.findOneAndUpdate(
            { withdrawalRequestId: id },
            { $set: { status: 'failed', description: `Lệnh rút tiền bị từ chối: ${adminNote}` } }
        );

        // 3. TỰ ĐỘNG HOÀN TRẢ LẠI TIỀN VÀO VÍ CỦA USER
        const user = await UserModel.findOne({ id: withdrawal.userId });
        if (user) {
            const balanceBefore = Number(user.walletBalance) || 0;
            const refundAmount = Number(withdrawal.amount) || 0;
            const balanceAfter = balanceBefore + refundAmount;

            user.walletBalance = balanceAfter;
            await user.save();

            // Tạo giao dịch hoàn trả số dư vào ví
            const refundTxId = `WT-REF-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
            const refundTx = new WalletTransactionModel({
                id: refundTxId,
                userId: user.id,
                userEmail: user.email,
                type: 'refund',
                amount: refundAmount,
                balanceBefore,
                balanceAfter,
                withdrawalRequestId: id,
                description: `Hoàn tiền lệnh rút tiền #${id} bị từ chối: ${adminNote}`,
                status: 'completed'
            });
            await refundTx.save();
        }

        res.json({
            success: true,
            message: `Đã từ chối yêu cầu rút tiền và hoàn lại ${withdrawal.amount.toLocaleString('vi-VN')} đ vào ví người dùng`,
            withdrawal
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllWithdrawals,
    approveWithdrawal,
    rejectWithdrawal
};
