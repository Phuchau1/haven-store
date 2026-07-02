const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Tạo URL thanh toán
router.post('/create-url', paymentController.createPaymentUrl);

// VNPay callback return
router.get('/vnpay-return', paymentController.vnpayReturn);

// MoMo callback return
router.get('/momo-return', paymentController.momoReturn);

// VNPay IPN (Webhook)
router.get('/vnpay-ipn', paymentController.vnpayIpn);

// MoMo IPN (Webhook)
router.post('/momo-ipn', paymentController.momoIpn);

// MoMo OTP Flow (Bước 1: Gửi OTP)
router.post('/momo-send-otp', paymentController.momoSendOtp);

// MoMo OTP Flow (Bước 2: Xác nhận OTP + hoàn tất thanh toán)
router.post('/momo-confirm', paymentController.momoConfirm);

module.exports = router;
