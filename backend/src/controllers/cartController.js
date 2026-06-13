const { CartModel } = require('../models/Cart');

exports.getCart = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });

        let cart = await CartModel.findOne({ user_id });
        if (!cart) {
            cart = new CartModel({
                id: `cart-${Math.random().toString(36).substr(2, 9)}`,
                user_id,
                items: []
            });
            await cart.save();
        }
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCart = async (req, res) => {
    try {
        const { user_id, items } = req.body;
        if (!user_id || !items) return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });

        let cart = await CartModel.findOne({ user_id });
        if (!cart) {
            cart = new CartModel({
                id: `cart-${Math.random().toString(36).substr(2, 9)}`,
                user_id,
                items
            });
        } else {
            cart.items = items;
        }
        await cart.save();
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });

        const cart = await CartModel.findOneAndUpdate({ user_id }, { items: [] }, { new: true });
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
