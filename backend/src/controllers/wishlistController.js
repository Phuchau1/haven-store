/**
 * ============================================================
 * CONTROLLER: WISHLIST (SẢN PHẨM YÊU THÍCH)
 * Mô tả: Xử lý các logic thêm, xóa, xem danh sách yêu thích
 * ============================================================
 */
const { WishlistModel } = require('../models/Wishlist');
const { ProductModel } = require('../models/Product');

/**
 * @desc    Lấy danh sách sản phẩm yêu thích của User
 * @route   GET /api/wishlist
 * @access  Private
 */
const getWishlist = async (req, res, next) => {
    try {
        const { user_id } = req.query; // Thường lấy từ req.user khi có auth middleware
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id' });
        }

        // Lấy danh sách wishlist của user
        const wishlistItems = await WishlistModel.find({ user_id }).sort({ created_at: -1 });
        
        // Lấy danh sách ID sản phẩm
        const productIds = wishlistItems.map(item => item.product_id);
        
        // Truy vấn bảng Product để lấy thông tin chi tiết
        const products = await ProductModel.find({ id: { $in: productIds } });
        
        // Trả về theo thứ tự đã thêm vào wishlist (mới nhất)
        const orderedProducts = [];
        wishlistItems.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
                // Thêm thuộc tính created_at để frontend biết ngày thêm
                const productObj = product.toObject();
                productObj.wishlist_added_at = item.created_at;
                orderedProducts.push(productObj);
            }
        });

        res.json({ success: true, wishlist: orderedProducts });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Thêm 1 sản phẩm vào danh sách yêu thích
 * @route   POST /api/wishlist
 * @access  Private
 */
const addWishlist = async (req, res, next) => {
    try {
        const { user_id, product_id } = req.body;
        
        if (!user_id || !product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        // Kiểm tra xem sản phẩm có tồn tại không
        const productExists = await ProductModel.exists({ id: product_id });
        if (!productExists) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        // Kiểm tra xem đã thêm vào wishlist chưa
        const existingItem = await WishlistModel.findOne({ user_id, product_id });
        if (existingItem) {
            return res.status(400).json({ success: false, message: 'Sản phẩm này đã có trong danh sách yêu thích' });
        }

        const id = `wl-${Math.random().toString(36).substr(2, 9)}`;
        const newWishlist = new WishlistModel({
            id,
            user_id,
            product_id,
            created_at: new Date().toISOString()
        });

        await newWishlist.save();
        res.json({ success: true, message: 'Đã thêm vào danh sách yêu thích', item: newWishlist });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xóa 1 sản phẩm khỏi danh sách yêu thích
 * @route   DELETE /api/wishlist/:productId
 * @access  Private
 */
const removeWishlist = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { user_id } = req.query; // Thường lấy từ token

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id' });
        }

        const deleted = await WishlistModel.findOneAndDelete({ user_id, product_id: productId });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không nằm trong danh sách yêu thích' });
        }

        res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xóa TOÀN BỘ danh sách yêu thích của User
 * @route   DELETE /api/wishlist/clear
 * @access  Private
 */
const clearWishlist = async (req, res, next) => {
    try {
        const { user_id } = req.query; // Thường lấy từ token

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id' });
        }

        await WishlistModel.deleteMany({ user_id });

        res.json({ success: true, message: 'Đã xóa toàn bộ danh sách yêu thích' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy dữ liệu thống kê Wishlist cho Admin
 * @route   GET /api/wishlist/admin-stats
 * @access  Private/Admin
 */
const getWishlistAdminStats = async (req, res, next) => {
    try {
        // Tổng số lượt yêu thích
        const totalFavorites = await WishlistModel.countDocuments();

        // Tổng số User có Wishlist (distinct)
        const uniqueUsers = await WishlistModel.distinct('user_id');
        const totalUsers = uniqueUsers.length;

        // Top 10 sản phẩm được yêu thích nhất
        const topProductsAggr = await WishlistModel.aggregate([
            { $group: { _id: '$product_id', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const topProductIds = topProductsAggr.map(item => item._id);
        const topProductsData = await ProductModel.find({ id: { $in: topProductIds } });

        const topProducts = topProductsAggr.map(item => {
            const product = topProductsData.find(p => p.id === item._id);
            return {
                id: item._id,
                name: product ? product.name : 'Sản phẩm đã bị xóa',
                image: product && product.images.length > 0 ? product.images[0] : null,
                price: product ? product.price : 0,
                inStock: product ? product.inStock : false,
                soldQuantity: product ? product.soldQuantity : 0,
                favorites_count: item.count
            };
        });

        res.json({
            success: true,
            stats: {
                totalFavorites,
                totalUsers,
                topProducts
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWishlist,
    addWishlist,
    removeWishlist,
    clearWishlist,
    getWishlistAdminStats
};
