const Newsletter = require('../models/Newsletter');
const logger = require('../utils/logger');

// ────────────────────────────────────────────────────────────
// PUBLIC: Đăng ký nhận newsletter & nhận mã WELCOME10
// POST /api/newsletter/subscribe
// ────────────────────────────────────────────────────────────
exports.subscribe = async (req, res) => {
    try {
        const { email } = req.body;
        const ip_address = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại!'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Kiểm tra xem email đã từng đăng ký chưa
        let subscriber = await Newsletter.findOne({ email: normalizedEmail });

        if (subscriber) {
            return res.json({
                success: true,
                isExisting: true,
                message: 'Email này đã đăng ký trước đó! Mã ưu đãi 10% của bạn là: WELCOME10',
                coupon: {
                    code: subscriber.coupon_code || 'WELCOME10',
                    discount_percent: subscriber.discount_percent || 10
                }
            });
        }

        // Tạo mới bản ghi đăng ký
        subscriber = await Newsletter.create({
            email: normalizedEmail,
            status: 'active',
            coupon_code: 'WELCOME10',
            discount_percent: 10,
            source: 'home_banner',
            ip_address
        });

        return res.status(201).json({
            success: true,
            isExisting: false,
            message: '🎉 Đăng ký thành công! Bạn nhận được mã giảm giá 10% cho đơn hàng đầu tiên.',
            coupon: {
                code: 'WELCOME10',
                discount_percent: 10
            }
        });

    } catch (error) {
        logger.error('Subscribe newsletter error: ' + error.message);
        return res.status(500).json({
            success: false,
            message: 'Không thể xử lý yêu cầu đăng ký. Vui lòng thử lại sau!'
        });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN: Lấy danh sách email đã đăng ký
// GET /api/newsletter/subscribers
// ────────────────────────────────────────────────────────────
exports.getSubscribers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 20);
        const search = req.query.search || '';

        const query = search ? { email: { $regex: search, $options: 'i' } } : {};

        const [subscribers, total] = await Promise.all([
            Newsletter.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Newsletter.countDocuments(query)
        ]);

        res.json({
            success: true,
            subscribers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('getSubscribers error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN: Xuất file CSV danh sách email
// GET /api/newsletter/export
// ────────────────────────────────────────────────────────────
exports.exportSubscribers = async (req, res) => {
    try {
        const subscribers = await Newsletter.find().sort({ createdAt: -1 }).lean();

        let csv = 'Email,Trang thai,Ma Voucher,Ngay dang ky,IP\n';
        subscribers.forEach(s => {
            const dateStr = s.createdAt ? new Date(s.createdAt).toISOString() : '';
            csv += `"${s.email}","${s.status}","${s.coupon_code || 'WELCOME10'}","${dateStr}","${s.ip_address || ''}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="newsletter_subscribers.csv"');
        res.status(200).send('\uFEFF' + csv);
    } catch (error) {
        logger.error('exportSubscribers error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN: Xóa email đăng ký
// DELETE /api/newsletter/subscribers/:id
// ────────────────────────────────────────────────────────────
exports.deleteSubscriber = async (req, res) => {
    try {
        const { id } = req.params;
        await Newsletter.findByIdAndDelete(id);
        res.json({ success: true, message: 'Đã xóa email khỏi danh sách đăng ký' });
    } catch (error) {
        logger.error('deleteSubscriber error: ' + error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
