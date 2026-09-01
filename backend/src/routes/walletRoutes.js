const express = require('express');
const router = express.Router();
const { 
    getUserWallet, 
    requestWithdrawal, 
    getWithdrawalHistory, 
    getUserBankAccounts, 
    saveUserBankAccount, 
    deleteUserBankAccount, 
    depositToWallet, 
    confirmDeposit, 
    payWithWallet 
} = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getUserWallet);
router.post('/withdraw', protect, requestWithdrawal);
router.get('/withdrawals', protect, getWithdrawalHistory);

// Quản lý tài khoản ngân hàng liên kết
router.get('/banks', protect, getUserBankAccounts);
router.post('/banks', protect, saveUserBankAccount);
router.delete('/banks/:id', protect, deleteUserBankAccount);

// Nạp tiền và Thanh toán ví
router.post('/deposit', protect, depositToWallet);
router.post('/deposit/confirm', protect, confirmDeposit);
router.post('/pay', protect, payWithWallet);

module.exports = router;
