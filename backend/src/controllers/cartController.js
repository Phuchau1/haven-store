/**
 * ============================================================
 * CONTROLLER: GIỎ HÀNG (Cart)
 * Mô tả: Xử lý lưu trữ giỏ hàng của người dùng trên cơ sở dữ liệu.
 *        Giúp đồng bộ giỏ hàng giữa nhiều thiết bị.
 * ============================================================
 */
const { CartModel } = require('../models/Cart');

/**
 * @desc Lấy giỏ hàng của một người dùng
 */
exports.getCart = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });

        let cart = await CartModel.findOne({ user_id });
        
        // Nếu người dùng chưa có giỏ hàng trong DB -> Tự động tạo giỏ hàng trống mới
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

/**
 * @desc Cập nhật toàn bộ giỏ hàng
 * @note Chấp nhận 1 mảng items từ phía client (Zustand store) đẩy lên để ghi đè.
 */
exports.updateCart = async (req, res) => {
    try {
        const { user_id, items } = req.body;
        if (!user_id || !items) return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });

        let cart = await CartModel.findOne({ user_id });
        
        if (!cart) {
            // Nếu không tìm thấy giỏ -> Tạo mới kèm items
            cart = new CartModel({
                id: `cart-${Math.random().toString(36).substr(2, 9)}`,
                user_id,
                items
            });
        } else {
            // Nếu đã có -> Ghi đè mảng items mới
            cart.items = items;
        }
        await cart.save();
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Xóa sạch giỏ hàng (Sau khi thanh toán thành công)
 */
exports.clearCart = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });

        // Tìm giỏ hàng theo user_id và làm rỗng mảng items
        const cart = await CartModel.findOneAndUpdate({ user_id }, { items: [] }, { new: true });
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
