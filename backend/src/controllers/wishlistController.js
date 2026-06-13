const { WishlistModel } = require('../models/Wishlist');

exports.getWishlist = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });

        let wishlist = await WishlistModel.findOne({ user_id });
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

exports.toggleWishlistItem = async (req, res) => {
    try {
        const { user_id, product_id } = req.body;
        if (!user_id || !product_id) return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });

        let wishlist = await WishlistModel.findOne({ user_id });
        if (!wishlist) {
            wishlist = new WishlistModel({
                id: `wl-${Math.random().toString(36).substr(2, 9)}`,
                user_id,
                items: [product_id]
            });
        } else {
            const idx = wishlist.items.indexOf(product_id);
            if (idx === -1) {
                wishlist.items.push(product_id);
            } else {
                wishlist.items.splice(idx, 1);
            }
        }
        await wishlist.save();
        res.status(200).json({ success: true, wishlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
