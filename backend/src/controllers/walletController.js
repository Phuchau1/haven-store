const mongoose = require('mongoose');
const { UserModel } = require('../models/User');
const { WalletTransactionModel } = require('../models/WalletTransaction');
const { WithdrawalRequestModel } = require('../models/WithdrawalRequest');
const { UserBankAccountModel } = require('../models/UserBankAccount');
const { OrderModel } = require('../models/Order');
const { buildVNPayUrl } = require('../services/vnpayService');
const { buildMoMoUrl } = require('../services/momoService');

const MIN_WITHDRAWAL_AMOUNT = 50000; // 50.000 VNĐ

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

        // Lấy các yêu cầu rút tiền đang chờ xử lý
        const pendingWithdrawals = await WithdrawalRequestModel.find({
            userId: user.id,
            status: 'pending'
        }).sort({ createdAt: -1 }).lean();

        res.json({
            success: true,
            walletBalance: user.walletBalance || 0,
            pendingWithdrawalsCount: pendingWithdrawals.length,
            transactions: transactions || []
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Tạo yêu cầu rút tiền từ Ví về tài khoản Ngân hàng
 * @route POST /api/wallet/withdraw
 * @access Private
 */
const requestWithdrawal = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const userEmail = req.user?.email;
        const { amount, bankCode, bankName, accountNumber, accountHolder, note, saveBank } = req.body;

        const numAmount = Number(amount);
        if (!numAmount || isNaN(numAmount) || numAmount < MIN_WITHDRAWAL_AMOUNT) {
            return res.status(400).json({
                success: false,
                message: `Số tiền rút tối thiểu là ${MIN_WITHDRAWAL_AMOUNT.toLocaleString('vi-VN')} đ`
            });
        }

        if (!bankCode || !bankName || !accountNumber || !accountHolder) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin tài khoản ngân hàng (Mã ngân hàng, Số tài khoản, Tên chủ tài khoản)'
            });
        }

        // Tìm User
        const user = await UserModel.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
        }

        const currentBalance = Number(user.walletBalance) || 0;
        if (currentBalance < numAmount) {
            return res.status(400).json({
                success: false,
                message: `Số dư ví không đủ. Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} đ, số tiền yêu cầu: ${numAmount.toLocaleString('vi-VN')} đ`
            });
        }

        // Trừ số dư khả dụng ngay lập tức để tránh rút đúp
        const newBalance = currentBalance - numAmount;
        user.walletBalance = newBalance;
        await user.save();

        const requestId = `WDR-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
        const txId = `WT-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;

        const cleanHolder = accountHolder.trim().toUpperCase();
        const cleanAccNum = accountNumber.trim().replace(/\s+/g, '');

        // 1. Tạo bản ghi WithdrawalRequest
        const withdrawal = new WithdrawalRequestModel({
            id: requestId,
            userId: user.id,
            userEmail: user.email,
            userName: user.name || '',
            userPhone: user.phone || '',
            amount: numAmount,
            fee: 0,
            netAmount: numAmount,
            bankInfo: {
                bankCode: bankCode.trim().toUpperCase(),
                bankName: bankName.trim(),
                accountNumber: cleanAccNum,
                accountHolder: cleanHolder
            },
            status: 'pending',
            note: note || ''
        });
        await withdrawal.save();

        // 2. Tạo bản ghi WalletTransaction (trạng thái pending)
        const walletTx = new WalletTransactionModel({
            id: txId,
            userId: user.id,
            userEmail: user.email,
            type: 'withdrawal',
            amount: -numAmount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            withdrawalRequestId: requestId,
            description: `Yêu cầu rút tiền về ${bankName} (${cleanAccNum} - ${cleanHolder})`,
            status: 'pending',
            metadata: {
                bankCode,
                bankName,
                accountNumber: cleanAccNum,
                accountHolder: cleanHolder
            }
        });
        await walletTx.save();

        // 3. Nếu người dùng chọn lưu tài khoản ngân hàng
        if (saveBank) {
            const existingBank = await UserBankAccountModel.findOne({
                userId: user.id,
                accountNumber: cleanAccNum,
                bankCode: bankCode.trim().toUpperCase()
            });
            if (!existingBank) {
                const bankId = `UBA-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
                await UserBankAccountModel.create({
                    id: bankId,
                    userId: user.id,
                    userEmail: user.email,
                    bankCode: bankCode.trim().toUpperCase(),
                    bankName: bankName.trim(),
                    accountNumber: cleanAccNum,
                    accountHolder: cleanHolder,
                    isDefault: false
                });
            }
        }

        res.json({
            success: true,
            message: `Tạo yêu cầu rút ${numAmount.toLocaleString('vi-VN')} đ thành công. Tiền sẽ được chuyển trong vòng 15-30 phút làm việc.`,
            withdrawal,
            walletBalance: newBalance,
            transaction: walletTx
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Lấy lịch sử các yêu cầu rút tiền của User
 * @route GET /api/wallet/withdrawals
 * @access Private
 */
const getWithdrawalHistory = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const list = await WithdrawalRequestModel.find({ userId }).sort({ createdAt: -1 }).lean();
        res.json({ success: true, withdrawals: list });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Lấy danh sách tài khoản ngân hàng đã lưu của User
 * @route GET /api/wallet/banks
 * @access Private
 */
const getUserBankAccounts = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const banks = await UserBankAccountModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
        res.json({ success: true, banks });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Lưu tài khoản ngân hàng mới
 * @route POST /api/wallet/banks
 * @access Private
 */
const saveUserBankAccount = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const userEmail = req.user?.email;
        const { bankCode, bankName, accountNumber, accountHolder, isDefault } = req.body;

        if (!bankCode || !bankName || !accountNumber || !accountHolder) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin ngân hàng bắt buộc' });
        }

        const cleanAccNum = accountNumber.trim().replace(/\s+/g, '');
        const cleanHolder = accountHolder.trim().toUpperCase();

        if (isDefault) {
            await UserBankAccountModel.updateMany({ userId }, { $set: { isDefault: false } });
        }

        const bankId = `UBA-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
        const newBank = new UserBankAccountModel({
            id: bankId,
            userId,
            userEmail,
            bankCode: bankCode.trim().toUpperCase(),
            bankName: bankName.trim(),
            accountNumber: cleanAccNum,
            accountHolder: cleanHolder,
            isDefault: !!isDefault
        });

        await newBank.save();
        res.json({ success: true, message: 'Đã lưu tài khoản ngân hàng thành công', bank: newBank });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Xóa tài khoản ngân hàng đã lưu
 * @route DELETE /api/wallet/banks/:id
 * @access Private
 */
const deleteUserBankAccount = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const deleted = await UserBankAccountModel.findOneAndDelete({ id, userId });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản ngân hàng' });
        }

        res.json({ success: true, message: 'Đã xóa tài khoản ngân hàng' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Nạp tiền vào Ví HAVEN (Khởi tạo link thanh toán hoặc mã QR)
 * @route POST /api/wallet/deposit
 * @access Private
 */
const depositToWallet = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { amount, paymentMethod } = req.body; // 'vnpay', 'momo', 'vietqr'

        const numAmount = Number(amount);
        if (!numAmount || numAmount < 10000) {
            return res.status(400).json({ success: false, message: 'Số tiền nạp tối thiểu là 10.000 VNĐ' });
        }

        const depositTxId = `DEP-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
        const orderInfo = `Nap tien vao vi HAVEN - ${depositTxId}`;

        if (paymentMethod === 'vnpay') {
            const payUrl = buildVNPayUrl(req, depositTxId, numAmount, orderInfo);
            return res.json({ success: true, paymentMethod: 'vnpay', url: payUrl, depositTxId });
        } else if (paymentMethod === 'momo') {
            const payUrl = await buildMoMoUrl(depositTxId, numAmount, orderInfo);
            return res.json({ success: true, paymentMethod: 'momo', url: payUrl, depositTxId });
        } else {
            // VietQR Mock hoặc chuyển khoản trực tiếp
            const qrUrl = `https://img.vietqr.io/image/MB-0348888999-compact2.png?amount=${numAmount}&addInfo=${encodeURIComponent(depositTxId)}&accountName=HAVEN%20STORE`;
            return res.json({
                success: true,
                paymentMethod: 'vietqr',
                depositTxId,
                amount: numAmount,
                qrUrl,
                bankInfo: {
                    bankName: 'MB Bank (Ngân hàng Quân Đội)',
                    accountNumber: '0348888999',
                    accountHolder: 'HAVEN STORE',
                    transferContent: depositTxId
                }
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Xác nhận nạp tiền vào ví thành công (cho mô phỏng/webhook)
 * @route POST /api/wallet/deposit/confirm
 * @access Private
 */
const confirmDeposit = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { depositTxId, amount } = req.body;

        const user = await UserModel.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        const numAmount = Number(amount) || 0;
        if (numAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Số tiền không hợp lệ' });
        }

        const balanceBefore = Number(user.walletBalance) || 0;
        const balanceAfter = balanceBefore + numAmount;
        user.walletBalance = balanceAfter;
        await user.save();

        const txId = `WT-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
        const walletTx = new WalletTransactionModel({
            id: txId,
            userId: user.id,
            userEmail: user.email,
            type: 'deposit',
            amount: numAmount,
            balanceBefore,
            balanceAfter,
            orderId: depositTxId || '',
            description: `Nạp tiền vào Ví HAVEN thành công (+${numAmount.toLocaleString('vi-VN')} đ)`,
            status: 'completed'
        });
        await walletTx.save();

        res.json({
            success: true,
            message: `Nạp thành công ${numAmount.toLocaleString('vi-VN')} đ vào ví`,
            walletBalance: balanceAfter,
            transaction: walletTx
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

        // Cập nhật trạng thái đơn hàng nếu tìm thấy orderId
        if (orderId) {
            await OrderModel.findOneAndUpdate(
                { id: orderId },
                { paymentStatus: 'paid', status: 'processing' }
            );
        }

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
    requestWithdrawal,
    getWithdrawalHistory,
    getUserBankAccounts,
    saveUserBankAccount,
    deleteUserBankAccount,
    depositToWallet,
    confirmDeposit,
    payWithWallet
};
