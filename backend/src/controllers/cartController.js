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
 *       Dùng findOneAndUpdate với $set để tránh validation lỗi Mongoose strict mode.
 */
exports.updateCart = async (req, res) => {
    try {
        const { user_id, items } = req.body;
        if (!user_id || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Thiếu dữ liệu hoặc items không hợp lệ' });
        }

        // Dùng findOneAndUpdate với upsert=true: tạo mới nếu chưa có, ghi đè nếu đã có
        const cart = await CartModel.findOneAndUpdate(
            { user_id },
            {
                $set: { items },
                $setOnInsert: { id: `cart-${Math.random().toString(36).substr(2, 9)}`, user_id }
            },
            { new: true, upsert: true, runValidators: false }
        );

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
