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
        // Chỉ lấy những banner có trạng thái 'active', sắp xếp mới nhất lên đầu
        const banners = await BannerModel.find({ status: 'active' }).sort({ createdAt: -1 });
        res.json({ success: true, banners });
    } catch (error) {
        next(error);
    }
};
