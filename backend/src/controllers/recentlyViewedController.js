const { RecentlyViewedModel } = require('../models/RecentlyViewed');
const { ProductModel } = require('../models/Product');

const MAX_ITEMS = 10;

/**
 * @desc Lấy danh sách sản phẩm đã xem gần đây của user
 * @route GET /api/recently-viewed?user_id=xxx
 */
exports.getRecentlyViewed = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });

        const records = await RecentlyViewedModel
            .find({ user_id })
            .sort({ viewed_at: -1 })
            .limit(MAX_ITEMS);

        const productIds = records.map(r => r.product_id);
        const products = await ProductModel.find({ id: { $in: productIds } });

        // Sắp xếp theo thứ tự đã xem (mới nhất trước)
        const ordered = records
            .map(r => products.find(p => p.id === r.product_id))
            .filter(Boolean)
            .map(p => p.toObject());

        res.json({ success: true, items: ordered });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Thêm sản phẩm vào danh sách đã xem gần đây
 * @route POST /api/recently-viewed
 * @body { user_id, product_id }
 */
exports.addRecentlyViewed = async (req, res) => {
    try {
        const { user_id, product_id } = req.body;
        if (!user_id || !product_id) return res.status(400).json({ success: false, message: 'Thiếu user_id hoặc product_id' });

        // Upsert: nếu đã có thì chỉ cập nhật viewed_at
        await RecentlyViewedModel.findOneAndUpdate(
            { user_id, product_id },
            { viewed_at: new Date() },
            { upsert: true, new: true }
        );

        // Giữ tối đa MAX_ITEMS bản ghi mới nhất cho user
        const allRecords = await RecentlyViewedModel.find({ user_id }).sort({ viewed_at: -1 });
        if (allRecords.length > MAX_ITEMS) {
            const toDelete = allRecords.slice(MAX_ITEMS).map(r => r._id);
            await RecentlyViewedModel.deleteMany({ _id: { $in: toDelete } });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
