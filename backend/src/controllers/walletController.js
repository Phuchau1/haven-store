const { UserModel } = require('../models/User');
const { WalletTransactionModel } = require('../models/WalletTransaction');
const { OrderModel } = require('../models/Order');

/**
 * Helper function: Hoàn tiền đơn hàng vào Ví của User & Lưu lịch sử giao dịch
 */
const refundOrderToWallet = async ({ userId, userEmail, userPhone, orderId, refundAmount, reason }) => {
    try {
        let targetUserId = userId;
        let targetEmail = userEmail;
        let targetPhone = userPhone;

        // Nếu thiếu info, tra cứu ngược từ đơn hàng OrderModel
        if (orderId && (!targetUserId || !targetEmail)) {
            const orderObj = await OrderModel.findOne({ id: orderId });
            if (orderObj) {
                if (!targetUserId) targetUserId = orderObj.userId;
                if (!targetEmail) targetEmail = orderObj.email;
                if (!targetPhone) targetPhone = orderObj.phone;
            }
        }

        // Tìm User trong CSDL bằng ID, Email hoặc Phone
        let userDoc = null;
        if (targetUserId) {
            userDoc = await UserModel.findOne({ id: targetUserId });
        }
        if (!userDoc && targetEmail) {
            userDoc = await UserModel.findOne({ email: targetEmail });
        }
        if (!userDoc && targetPhone) {
            userDoc = await UserModel.findOne({ phone: targetPhone });
        }
        // Fallback: Lấy user có email hoặc id tương tự
        if (!userDoc && targetEmail) {
            userDoc = await UserModel.findOne({ email: { $regex: new RegExp(`^${targetEmail.trim()}$`, 'i') } });
        }

        if (!userDoc) {
            throw new Error(`Không tìm thấy tài khoản người dùng tương ứng (${targetEmail || targetUserId || targetPhone}) để nạp tiền ví`);
        }

        // Kiểm tra xem đơn hàng đã từng được refund trùng lặp hay chưa
        const existingTx = await WalletTransactionModel.findOne({ orderId, type: 'refund' });
        if (existingTx) {
            console.log(`[Wallet] Đơn hàng ${orderId} đã từng được hoàn tiền vào ví trước đó.`);
            return {
                alreadyRefunded: true,
                walletBalance: userDoc.walletBalance || 0,
                transaction: existingTx
            };
        }

        const balanceBefore = Number(userDoc.walletBalance) || 0;
        const amountToAdd = Number(refundAmount) || 0;
        const balanceAfter = balanceBefore + amountToAdd;

        // Tăng số dư Ví User
        userDoc.walletBalance = balanceAfter;
        await userDoc.save();

        // Lưu lịch sử giao dịch vào cơ sở dữ liệu
        const txId = `WT-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
        const walletTx = new WalletTransactionModel({
            id: txId,
            userId: userDoc.id,
            userEmail: userDoc.email,
            type: 'refund',
            amount: amountToAdd,
            balanceBefore,
            balanceAfter,
            orderId: orderId || '',
            description: reason || `Hoàn tiền đơn hàng #${orderId} vào ví HAVEN`,
            status: 'completed'
        });

        await walletTx.save();

        console.log(`[Wallet Refund] Đã hoàn thành hoàn tiền ${amountToAdd} VNĐ vào ví user ${userDoc.email}. Số dư mới: ${balanceAfter} VNĐ`);

        return {
            success: true,
            walletBalance: balanceAfter,
            transaction: walletTx
        };
    } catch (err) {
        console.error('[Wallet Refund Error]:', err.message);
        throw err;
    }
};

/**
 * @desc Lấy thông tin số dư ví & lịch sử giao dịch ví của User
 * @route GET /api/wallet
 * @access Private
 */
const getUserWallet = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const userEmail = req.user?.email;

        let user = null;
        if (userId) user = await UserModel.findOne({ id: userId });
        if (!user && userEmail) user = await UserModel.findOne({ email: userEmail });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        // Lấy lịch sử giao dịch ví
        const transactions = await WalletTransactionModel.find({ 
            $or: [{ userId: user.id }, { userEmail: user.email }] 
        }).sort({ createdAt: -1 }).limit(50).lean();

        res.json({
            success: true,
            walletBalance: user.walletBalance || 0,
            transactions: transactions || []
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Thanh toán đơn hàng bằng Ví HAVEN
 * @route POST /api/wallet/pay
 * @access Private
 */
const payWithWallet = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { orderId, amount } = req.body;

        const user = await UserModel.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        const currentBalance = Number(user.walletBalance) || 0;
        const payAmount = Number(amount) || 0;

        if (currentBalance < payAmount) {
            return res.status(400).json({ 
                success: false, 
                message: `Số dư ví không đủ để thanh toán. Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} đ` 
            });
        }

        const balanceAfter = currentBalance - payAmount;
        user.walletBalance = balanceAfter;
        await user.save();

        const txId = `WT-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
        const walletTx = new WalletTransactionModel({
            id: txId,
            userId: user.id,
            userEmail: user.email,
            type: 'payment',
            amount: -payAmount,
            balanceBefore: currentBalance,
            balanceAfter,
            orderId: orderId || '',
            description: `Thanh toán đơn hàng #${orderId} bằng Ví HAVEN`,
            status: 'completed'
        });

        await walletTx.save();

        res.json({
            success: true,
            message: 'Thanh toán bằng Ví HAVEN thành công',
            walletBalance: balanceAfter,
            transaction: walletTx
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    refundOrderToWallet,
    getUserWallet,
    payWithWallet
};
