/**
 * ============================================================
 * MIDDLEWARE: XÁC THỰC & PHÂN QUYỀN (Authentication & Authorization)
 * Mô tả: Kiểm tra danh tính người dùng và quyền truy cập trước
 *        khi cho phép đi vào các route được bảo vệ.
 *
 * Cơ chế hoạt động:
 *  - Frontend gửi kèm header 'x-user-id' hoặc 'Authorization: Bearer <token>'
 *  - Middleware tra cứu user trong DB để xác nhận tồn tại
 *  - Nếu hợp lệ: gắn user vào req.user và cho qua (next())
 *  - Nếu không hợp lệ: trả về lỗi 401 hoặc 403
 * ============================================================
 */

const { UserModel } = require('../models/User');

/**
 * Middleware `protect` — Bảo vệ route, yêu cầu đăng nhập
 * Lấy userId từ header 'x-user-id' hoặc token Bearer,
 * sau đó tìm user trong DB và gắn vào req.user.
 */
const protect = async (req, res, next) => {
    // Lấy userId từ header hoặc body (ưu tiên header)
    const userId    = req.headers['x-user-id'] || req.body?.userId;
    const authHeader = req.headers['authorization']; // Dạng "Bearer <token>"

    // Nếu không có cả hai thì từ chối ngay
    if (!userId && !authHeader) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }

    try {
        let user;

        // Bước 1: Tìm theo x-user-id (trường id tùy chỉnh, không phải _id)
        if (userId) {
            user = await UserModel.findOne({ id: userId }).lean();
        }

        // Bước 2: Nếu chưa tìm thấy, thử tìm theo Bearer token
        if (!user && authHeader) {
            const tokenId = authHeader.replace('Bearer ', '').trim();

            // Thử tìm theo trường id tùy chỉnh
            user = await UserModel.findOne({ id: tokenId }).lean();

            // Thử tìm theo MongoDB ObjectId (_id) nếu vẫn không tìm thấy
            if (!user) {
                user = await UserModel.findById(tokenId).lean().catch(() => null);
            }
        }

        // Nếu không tìm thấy user nào khớp → từ chối
        if (!user) {
            return res.status(401).json({ success: false, message: 'Người dùng không tồn tại.' });
        }

        // Gắn thông tin user vào request để các handler tiếp theo sử dụng
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Xác thực thất bại.' });
    }
};

/**
 * Middleware `admin` — Phân quyền quản trị viên
 * Phải dùng SAU middleware `protect`.
 * Chỉ cho phép đi tiếp nếu user có role === 'admin'.
 */
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // Hợp lệ → cho phép tiếp tục
    } else {
        // Không đủ quyền → trả về lỗi 403 Forbidden
        res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền thực hiện.' });
    }
};

module.exports = { protect, admin };
