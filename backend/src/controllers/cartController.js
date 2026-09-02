/**
 * ============================================================
 * CONTROLLER: GIỎ HÀNG (Cart)
 * Mô tả: Xử lý lưu trữ giỏ hàng của người dùng trên cơ sở dữ liệu.
 *        Giúp đồng bộ giỏ hàng giữa nhiều thiết bị.
 *        updateCart kiểm tra tồn kho & clamp số lượng nếu vượt.
 * ============================================================
 */
const { CartModel } = require('../models/Cart');
const { ProductModel } = require('../models/Product');
const { ProductVariantModel } = require('../models/ProductVariant');
const { UserModel } = require('../models/User');

/**
 * @desc Lấy giỏ hàng của một người dùng
 */
exports.getCart = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });

        const aliases = [String(user_id)];
        const isObjectId = typeof user_id === 'string' && user_id.match(/^[0-9a-fA-F]{24}$/);
        const orConditions = [{ id: user_id }, { email: user_id }];
        if (isObjectId) orConditions.push({ _id: user_id });

        const dbUser = await UserModel.findOne({ $or: orConditions }).lean().catch(() => null);

        if (dbUser) {
            if (dbUser.id) aliases.push(String(dbUser.id));
            if (dbUser._id) aliases.push(String(dbUser._id));
            if (dbUser.email) aliases.push(String(dbUser.email));
        }

        const cleanAliases = Array.from(new Set(aliases.filter(Boolean)));
        let cart = await CartModel.findOne({ user_id: { $in: cleanAliases } });

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
 * @note Validate tồn kho từng item. Nếu số lượng vượt kho sẽ tự động clamp và
 *       trả về { adjusted: true, adjustedItems } để FE hiển thị cảnh báo.
 */
exports.updateCart = async (req, res) => {
    try {
        const { user_id, items } = req.body;
        if (!user_id || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Thiếu dữ liệu hoặc items không hợp lệ' });
        }

        const adjustedItems = []; // items đã được điều chỉnh số lượng
        const warnings = [];      // mảng cảnh báo gửi về FE

        for (const item of items) {
            const productId = item.product?.id;
            const size = item.selectedSize;
            const colorName = item.selectedColor?.name;
            let qty = Number(item.quantity);

            // Bỏ qua item không hợp lệ
            if (!productId || !size || !colorName || qty < 1) {
                adjustedItems.push(item);
                continue;
            }

            // Kiểm tra tồn kho qua ProductVariant
            const variant = await ProductVariantModel.findOne({
                product_id: productId,
                size_id: size,
                color_id: colorName
            });

            let available = null;

            if (variant) {
                available = (variant.stock || 0) - (variant.reserved_stock || 0);
            } else {
                // Fallback: kiểm tra qua embedded variants trong Product
                const dbProduct = await ProductModel.findOne({ id: productId });
                if (dbProduct) {
                    const embedded = (dbProduct.variants || []).find(
                        v => v.color === colorName && v.size === size
                    );
                    if (embedded) available = Number(embedded.stock) || 0;
                }
            }

            if (available !== null && qty > available) {
                const productName = item.product?.name || productId;
                if (available <= 0) {
                    // Sản phẩm hết hàng — xóa khỏi giỏ
                    warnings.push(`Sản phẩm "${productName} (${colorName}/${size})" đã hết hàng và đã được xóa khỏi giỏ.`);
                    continue; // Không push vào adjustedItems → sẽ bị loại
                } else {
                    // Clamp về tồn kho tối đa
                    warnings.push(`Sản phẩm "${productName} (${colorName}/${size})" chỉ còn ${available} chiếc. Đã điều chỉnh số lượng.`);
                    qty = available;
                }
            }

            adjustedItems.push({ ...item, quantity: qty });
        }

        // Lưu giỏ hàng đã được điều chỉnh vào DB
        const cart = await CartModel.findOneAndUpdate(
            { user_id },
            {
                $set: { items: adjustedItems },
                $setOnInsert: { id: `cart-${Math.random().toString(36).substr(2, 9)}`, user_id }
            },
            { new: true, upsert: true, runValidators: false }
        );

        res.status(200).json({
            success: true,
            cart,
            adjusted: warnings.length > 0,
            warnings
        });
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
