/**
 * ============================================================
 * MIDDLEWARE: RATE LIMITER — Giới hạn tần suất gọi API
 * Mục đích: Bảo vệ API khỏi brute-force, DDoS, spam request.
 * Sử dụng: express-rate-limit (đã cài sẵn trong package.json)
 * ============================================================
 */
const rateLimit = require('express-rate-limit');

/**
 * globalLimiter — Giới hạn chung cho toàn bộ /api
 * 200 request mỗi 15 phút mỗi IP
 */
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.'
    }
});

/**
 * authLimiter — Giới hạn chặt cho các endpoint đăng nhập / đăng ký
 * 10 request mỗi 15 phút mỗi IP — Chống brute-force mật khẩu
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.'
    },
    skipSuccessfulRequests: true // Không đếm các request thành công (chỉ tính lần thất bại)
});

/**
 * orderLimiter — Giới hạn cho endpoint đặt hàng
 * 10 request mỗi phút mỗi IP — Chống spam đơn hàng
 */
const orderLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Bạn đặt hàng quá nhanh. Vui lòng chờ 1 phút trước khi thử lại.'
    }
});

/**
 * uploadLimiter — Giới hạn upload file
 * 20 request mỗi phút mỗi IP
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Bạn upload quá nhiều. Vui lòng chờ 1 phút.'
    }
});

module.exports = { globalLimiter, authLimiter, orderLimiter, uploadLimiter };
