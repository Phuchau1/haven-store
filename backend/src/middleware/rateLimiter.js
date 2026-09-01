/**
 * ============================================================
 * MIDDLEWARE: RATE LIMITER — Giới hạn tần suất gọi API & Tối ưu hiệu năng
 * Mục đích: Bảo vệ API khỏi DDoS / Spam đồng thời không làm gián đoạn trải nghiệm người dùng
 * ============================================================
 */
const rateLimit = require('express-rate-limit');

/**
 * globalLimiter — Giới hạn chung cho toàn bộ /api
 * Cho phép 10.000 requests / 15 phút mỗi IP, tự động skip cho các request GET đọc dữ liệu & admin
 */
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000, // Ngưỡng cao 10.000 để đảm bảo web chạy cực kỳ mượt mà
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    skip: (req) => {
        // Luôn bỏ qua rate limit cho:
        // 1. Health check
        if (req.path === '/health' || req.path === '/api/health' || req.path === '/') return true;
        // 2. Request GET đọc dữ liệu thông thường (products, menus, categories, banners, wallet, settings,...)
        if (req.method === 'GET') return true;
        // 3. User có token xác thực hoặc Admin
        if (req.headers.authorization) return true;
        return false;
    },
    message: {
        success: false,
        message: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau vài giây.'
    }
});

/**
 * authLimiter — Giới hạn cho các endpoint đăng nhập / đăng ký (ngăn brute force)
 * Cho phép 100 lần thử mỗi 15 phút
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: {
        success: false,
        message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.'
    },
    skipSuccessfulRequests: true
});

/**
 * orderLimiter — Giới hạn cho endpoint đặt hàng
 * 100 request mỗi phút
 */
const orderLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: {
        success: false,
        message: 'Bạn đặt hàng quá nhanh. Vui lòng chờ vài giây trước khi thử lại.'
    }
});

/**
 * uploadLimiter — Giới hạn upload file
 * 100 request mỗi phút
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: {
        success: false,
        message: 'Bạn upload quá nhiều. Vui lòng chờ vài giây.'
    }
});

module.exports = { globalLimiter, authLimiter, orderLimiter, uploadLimiter };
