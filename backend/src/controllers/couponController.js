const { CouponModel } = require('../models/Coupon');
const { OrderModel } = require('../models/Order');

// GET /api/coupons/available — trả về các coupon còn hiệu lực
const getAvailableCoupons = async (req, res) => {
    try {
        const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const coupons = await CouponModel.find();
        const available = coupons.filter(c => c.end_date >= now && c.start_date <= now && c.usage_limit > 0);
        res.json({ success: true, coupons: available });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/coupons/apply — validate mã coupon và trả về thông tin giảm giá
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
        if (coupon.start_date > now) {
            return res.status(400).json({ success: false, message: 'Mã voucher chưa đến ngày sử dụng.' });
        }
        if (coupon.end_date < now) {
            return res.status(400).json({ success: false, message: 'Mã voucher đã hết hạn.' });
        }
        if (coupon.usage_limit <= 0) {
            return res.status(400).json({ success: false, message: 'Mã voucher đã hết lượt sử dụng.' });
        }

        if (coupon.usage_limit_per_user > 0 && email) {
            const userUsedCount = await OrderModel.countDocuments({ couponCode: coupon.code, email: email, status: { $ne: 'cancelled' } });
            if (userUsedCount >= coupon.usage_limit_per_user) {
                return res.status(400).json({ success: false, message: 'Bạn đã hết lượt sử dụng mã giảm giá này.' });
            }
        }

        let discountAmount = 0;
        if (coupon.discount_type === 'percent') {
            discountAmount = Math.round((totalAmount * coupon.discount_value) / 100);
        } else {
            discountAmount = coupon.discount_value;
        }

        // Không giảm quá tổng tiền
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

module.exports = { getAvailableCoupons, applyCoupon };
