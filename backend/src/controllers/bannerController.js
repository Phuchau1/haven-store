/**
 * ============================================================
 * CONTROLLER: QUẢNG CÁO (Banner)
 * Mô tả: Xử lý việc lấy danh sách các banner quảng cáo để 
 *        hiển thị trên trang chủ (Hero Banner / Slide).
 * ============================================================
 */
const { BannerModel } = require('../models/Banner');

/**
 * @desc Lấy danh sách các banner đang hoạt động (active)
 * @route GET /api/banners
 */
exports.getBanners = async (req, res, next) => {
    try {
        const { type } = req.query;
        const filter = { status: 'active' };
        if (type) {
            filter.type = type;
        }

        if (type === 'collection' || !type) {
            const hasCollection = await BannerModel.findOne({ type: 'collection' });
            if (!hasCollection) {
                await BannerModel.create({
                    id: 'banner-collection-1',
                    title: 'BST XUÂN HÈ 2026: EASY DAILY | BẮT NHỊP SỐNG - HÒA NHỊP SỐNG',
                    subtitle: '✨ BST Xuân Hè cập bến mang theo tinh thần "Easy" thoải mái trải nghiệm cùng những trang phục "Daily" tiện dụng mỗi ngày. HAVEN tin rằng, khi trang phục đủ nhẹ tênh, tâm trí sẽ tự khắc rộng mở để bạn bắt trọn nhịp điệu cuộc sống. Sẵn sàng cho một diện mạo rạng rỡ và trải nghiệm đầy năng lượng cùng HAVEN ngay hôm nay!',
                    image: '/bst-xuan-he-2026.png',
                    link: '/products',
                    link_text: 'Xem chi tiết',
                    type: 'collection',
                    status: 'active'
                });
            }
        }

        const banners = await BannerModel.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, banners });
    } catch (error) {
        next(error);
    }
};
