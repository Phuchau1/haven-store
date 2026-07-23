/**
 * ============================================================
 * CONTROLLER: ANALYTICS TRACKING
 * Mô tả: Nhận event từ frontend và lưu vào DB.
 *        Cung cấp API thống kê cho Admin dashboard.
 * ============================================================
 */
const { AnalyticsEventModel } = require('../models/AnalyticsEvent');

/**
 * @desc    Ghi nhận một sự kiện analytics từ frontend
 * @route   POST /api/analytics/track
 * @access  Public (không cần đăng nhập)
 */
const trackEvent = async (req, res, next) => {
    try {
        const {
            eventType, page, userId, sessionId, metadata
        } = req.body;

        if (!eventType) {
            return res.status(400).json({ success: false, message: 'Thiếu eventType.' });
        }

        // Lấy device type từ user-agent
        const userAgent = req.headers['user-agent'] || '';
        const device = /mobile/i.test(userAgent) ? 'mobile'
                     : /tablet/i.test(userAgent) ? 'tablet'
                     : 'desktop';

        await AnalyticsEventModel.create({
            eventType,
            page:      page || req.headers['referer'] || '',
            userId:    userId || null,
            sessionId: sessionId || req.headers['x-session-id'] || null,
            metadata: {
                ...metadata,
                device,
                userAgent: userAgent.substring(0, 200), // Giới hạn độ dài
            }
        });

        // Trả về nhanh, không chờ DB confirm
        return res.status(201).json({ success: true });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy thống kê tổng quan cho Admin dashboard
 * @route   GET /api/analytics/summary
 * @query   { days = 7 } — Số ngày gần đây cần thống kê
 * @access  Private (Admin)
 */
const getSummary = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const since = new Date();
        since.setDate(since.getDate() - days);

        // Thống kê theo loại event
        const eventCounts = await AnalyticsEventModel.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $group: { _id: '$eventType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Lượt xem trang theo ngày (Page Views)
        const pageViewsByDay = await AnalyticsEventModel.aggregate([
            { $match: { eventType: 'page_view', createdAt: { $gte: since } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+07:00' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top sản phẩm được xem nhiều nhất
        const topProducts = await AnalyticsEventModel.aggregate([
            { $match: { eventType: 'product_view', createdAt: { $gte: since }, 'metadata.productId': { $ne: null } } },
            { $group: { _id: '$metadata.productId', productName: { $first: '$metadata.productName' }, views: { $sum: 1 } } },
            { $sort: { views: -1 } },
            { $limit: 10 }
        ]);

        // Conversion funnel
        const funnelEvents = ['page_view', 'product_view', 'add_to_cart', 'begin_checkout', 'purchase'];
        const funnelData = eventCounts.reduce((acc, item) => {
            if (funnelEvents.includes(item._id)) {
                acc[item._id] = item.count;
            }
            return acc;
        }, {});

        // Phân bổ thiết bị
        const deviceBreakdown = await AnalyticsEventModel.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $group: { _id: '$metadata.device', count: { $sum: 1 } } }
        ]);

        return res.json({
            success: true,
            period: `${days} ngày gần đây`,
            summary: {
                eventCounts,
                pageViewsByDay,
                topProducts,
                funnel: funnelData,
                deviceBreakdown,
                totalEvents: eventCounts.reduce((sum, e) => sum + e.count, 0),
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy lịch sử tìm kiếm phổ biến
 * @route   GET /api/analytics/searches
 * @access  Private (Admin)
 */
const getTopSearches = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const searches = await AnalyticsEventModel.aggregate([
            {
                $match: {
                    eventType: 'search',
                    createdAt: { $gte: since },
                    'metadata.searchQuery': { $ne: null }
                }
            },
            { $group: { _id: '$metadata.searchQuery', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);

        return res.json({ success: true, searches });
    } catch (error) {
        next(error);
    }
};

module.exports = { trackEvent, getSummary, getTopSearches };
