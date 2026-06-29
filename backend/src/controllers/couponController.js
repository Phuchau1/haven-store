/**
 * ============================================================
 * CONTROLLER: MÃ GIẢM GIÁ (Coupon)
 * Mô tả: Xử lý logic lấy danh sách mã giảm giá khả dụng và 
 *        áp dụng tính toán mã giảm giá cho đơn hàng.
 * ============================================================
 */
const { CouponModel } = require('../models/Coupon');
const { OrderModel } = require('../models/Order');

/**
 * @desc Lấy danh sách các mã giảm giá (coupon) CÒN HIỆU LỰC
 * @route GET /api/coupons/available
 */
const getAvailableCoupons = async (req, res) => {
    try {
        const now = new Date().toISOString().slice(0, 10); // Lấy ngày hiện tại dạng YYYY-MM-DD
        const coupons = await CouponModel.find();
        
        // Chỉ trả về các coupon: chưa hết hạn, đã bắt đầu, và còn lượt sử dụng
        const available = coupons.filter(c => c.end_date >= now && c.start_date <= now && c.usage_limit > 0);
        
        res.json({ success: true, coupons: available });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Kiểm tra và áp dụng mã giảm giá, tính toán số tiền được giảm
 * @route POST /api/coupons/apply
 */
const applyCoupon = async (req, res) => {
    try {
        const { code, totalAmount, email } = req.body;

        if (!code || !totalAmount) {
            return res.status(400).json({ success: false, message: 'Thiếu mã coupon hoặc tổng tiền.' });
        }

        const coupon = await CouponModel.findOne({ code: code.toUpperCase().trim() });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Mã voucher không tồn tại.' });
        }

        const now = new Date().toISOString().slice(0, 10);
        
        // Kiểm tra tính hợp lệ của thời gian và số lượng
        if (coupon.start_date > now) {
            return res.status(400).json({ success: false, message: 'Mã voucher chưa đến ngày sử dụng.' });
        }
        if (coupon.end_date < now) {
            return res.status(400).json({ success: false, message: 'Mã voucher đã hết hạn.' });
        }
        if (coupon.usage_limit <= 0) {
            return res.status(400).json({ success: false, message: 'Mã voucher đã hết lượt sử dụng.' });
        }

        // Kiểm tra giới hạn số lần sử dụng của một người dùng (nếu có đăng nhập / có email)
        if (coupon.usage_limit_per_user > 0 && email) {
            const userUsedCount = await OrderModel.countDocuments({ 
                couponCode: coupon.code, 
                email: email, 
                status: { $ne: 'cancelled' } // Không tính các đơn đã hủy
            });
            if (userUsedCount >= coupon.usage_limit_per_user) {
                return res.status(400).json({ success: false, message: 'Bạn đã hết lượt sử dụng mã giảm giá này.' });
            }
        }

        // Tính toán số tiền được giảm
        let discountAmount = 0;
        if (coupon.discount_type === 'percent') {
            discountAmount = Math.round((totalAmount * coupon.discount_value) / 100);
        } else {
            discountAmount = coupon.discount_value; // Trừ thẳng tiền mặt
        }

        // Số tiền giảm không được vượt quá tổng giá trị đơn hàng
        discountAmount = Math.min(discountAmount, totalAmount);
        const finalAmount = totalAmount - discountAmount;

        res.json({
            success: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
            },
            discountAmount,
            finalAmount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Cập nhật thông tin mã giảm giá
 * @route PUT /api/coupons/:id
 */
const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID mã giảm giá.' });
        }

        const updatedCoupon = await CouponModel.findOneAndUpdate(
            { id },
            req.body,
            { new: true } // Trả về bản ghi mới nhất sau khi cập nhật
        );

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
        }

        res.json({ success: true, message: 'Cập nhật mã giảm giá thành công.', coupon: updatedCoupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Xóa mã giảm giá
 * @route DELETE /api/coupons/:id
 */
const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID mã giảm giá.' });
        }

        const deletedCoupon = await CouponModel.findOneAndDelete({ id });

        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
        }

        res.json({ success: true, message: 'Xóa mã giảm giá thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAvailableCoupons, applyCoupon, updateCoupon, deleteCoupon };
