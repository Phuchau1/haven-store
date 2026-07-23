const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

// Áp dụng rate limit cho các endpoint đăng nhập / đăng ký (chống brute-force)
router.post('/login', authLimiter, authController.login);
router.post('/register', authLimiter, authController.register);
router.put('/profile', authController.updateProfile);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/verify-otp', authLimiter, authController.verifyOtp);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Social Login
router.post('/google', authLimiter, authController.googleLogin);
router.post('/facebook', authLimiter, authController.facebookLogin);

module.exports = router;
