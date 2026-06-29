/**
 * ============================================================
 * CONTROLLER: SẢN PHẨM YÊU THÍCH (Wishlist)
 * Mô tả: Xử lý danh sách sản phẩm yêu thích của người dùng.
 *        Cung cấp API để lấy danh sách và Toggle (Thêm/Xóa) sản phẩm.
 * ============================================================
 */
const { WishlistModel } = require('../models/Wishlist');

/**
 * @desc Lấy danh sách sản phẩm yêu thích của một người dùng
 */
exports.getWishlist = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });

        let wishlist = await WishlistModel.findOne({ user_id });
        
        // Nếu người dùng chưa từng có Wishlist -> Tự động tạo mới một danh sách rỗng
        if (!wishlist) {
            wishlist = new WishlistModel({
                id: `wl-${Math.random().toString(36).substr(2, 9)}`,
                user_id,
                items: []
            });
            await wishlist.save();
        }
        res.status(200).json({ success: true, wishlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Toggle (Bật/Tắt) sản phẩm khỏi danh sách yêu thích
 * @note Nếu sản phẩm đã có trong danh sách -> Xóa đi. Nếu chưa có -> Thêm vào.
 */
exports.toggleWishlistItem = async (req, res) => {
    try {
        const { user_id, product_id } = req.body;
        if (!user_id || !product_id) return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });

        let wishlist = await WishlistModel.findOne({ user_id });
        
        if (!wishlist) {
            // Nếu chưa có Wishlist, tạo mới và đưa luôn sản phẩm này vào
            wishlist = new WishlistModel({
                id: `wl-${Math.random().toString(36).substr(2, 9)}`,
                user_id,
                items: [product_id]
            });
        } else {
            // Kiểm tra xem sản phẩm đã nằm trong mảng items chưa
            const idx = wishlist.items.indexOf(product_id);
            if (idx === -1) {
                // Chưa có -> Thêm vào
                wishlist.items.push(product_id);
            } else {
                // Đã có -> Xóa khỏi mảng
                wishlist.items.splice(idx, 1);
            }
        }
        await wishlist.save();
        res.status(200).json({ success: true, wishlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
