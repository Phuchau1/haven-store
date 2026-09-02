/**
 * ============================================================
 * CONTROLLER: MÃ GIẢM GIÁ (Coupon)
 * Mô tả: Xử lý logic lấy danh sách mã giảm giá khả dụng và 
 *        áp dụng tính toán mã giảm giá cho đơn hàng.
 * ============================================================
 */
const { CouponModel } = require('../models/Coupon');
const { OrderModel } = require('../models/Order');
const { UserModel } = require('../models/User');
const UserCoupon = require('../models/UserCoupon');

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
 * @desc Lấy danh sách kho Voucher cá nhân của người dùng (từ Vòng quay may mắn & quà tặng)
 * @route GET /api/coupons/my-coupons
 */
const getUserCoupons = async (req, res) => {
    try {
        const aliases = [];
        const u = req.user;
        if (u) {
            if (u.id) aliases.push(String(u.id));
            if (u._id) aliases.push(String(u._id));
            if (u.email) aliases.push(String(u.email));
        }

        const headerUserId = req.headers['x-user-id'];
        const queryUserId = req.query.user_id;
        if (headerUserId) aliases.push(String(headerUserId));
        if (queryUserId) aliases.push(String(queryUserId));

        // Tra cứu thêm User trong DB nếu có email hoặc ID để gom đủ tất cả các định dạng id/_id
        const searchTerms = Array.from(new Set(aliases.filter(Boolean)));
        if (searchTerms.length > 0) {
            const dbUsers = await UserModel.find({
                $or: [
                    { id: { $in: searchTerms } },
                    { email: { $in: searchTerms } }
                ]
            }).lean().catch(() => []);

            dbUsers.forEach(userItem => {
                if (userItem.id) aliases.push(String(userItem.id));
                if (userItem._id) aliases.push(String(userItem._id));
                if (userItem.email) aliases.push(String(userItem.email));
            });
        }

        const cleanAliases = Array.from(new Set(aliases.filter(Boolean)));
        const coupons = await UserCoupon.find({ user_id: { $in: cleanAliases } }).sort({ createdAt: -1 });

        const now = new Date();
        const formatted = coupons.map(c => {
            let status = 'unused';
            if (c.is_used) status = 'used';
            else if (c.expires_at && new Date(c.expires_at) < now) status = 'expired';

            const defaultRewardName = c.reward_name || (
                c.type === 'percent' 
                    ? `Giảm ${c.discount_value}%` 
                    : c.type === 'shipping' 
                        ? 'Freeship toàn quốc' 
                        : `Giảm ${(c.discount_value || 0).toLocaleString('vi-VN')}đ`
            );

            return {
                id: c._id,
                _id: c._id,
                reward_name: defaultRewardName,
                code: c.coupon_code,
                type: c.type,
                discount_value: c.discount_value,
                expires_at: c.expires_at,
                is_used: c.is_used,
                status
            };
        });

        res.json({ success: true, coupons: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Kiểm tra và áp dụng mã giảm giá, tính toán số tiền được giảm (Hỗ trợ cả Coupon hệ thống và UserCoupon cá nhân)
 * @route POST /api/coupons/apply
 */
const applyCoupon = async (req, res) => {
    try {
        const { code, totalAmount, email } = req.body;
        const codeClean = code ? code.toUpperCase().trim() : '';

        if (!codeClean || !totalAmount) {
            return res.status(400).json({ success: false, message: 'Thiếu mã coupon hoặc tổng tiền.' });
        }

        // 1. Kiểm tra trong UserCoupon (Voucher cá nhân trúng từ Vòng quay)
        const userCoupon = await UserCoupon.findOne({ coupon_code: codeClean });
        if (userCoupon) {
            const now = new Date();
            if (userCoupon.is_used) {
                return res.status(400).json({ success: false, message: 'Mã voucher này đã được sử dụng.' });
            }
            if (userCoupon.expires_at && new Date(userCoupon.expires_at) < now) {
                return res.status(400).json({ success: false, message: 'Mã voucher này đã hết hạn.' });
            }

            let discountAmount = 0;
            if (userCoupon.type === 'percent') {
                discountAmount = Math.round((totalAmount * userCoupon.discount_value) / 100);
            } else {
                discountAmount = userCoupon.discount_value;
            }
            discountAmount = Math.min(discountAmount, totalAmount);
            const finalAmount = totalAmount - discountAmount;

            return res.json({
                success: true,
                coupon: {
                    id: userCoupon._id,
                    code: userCoupon.coupon_code,
                    discount_type: userCoupon.type,
                    discount_value: userCoupon.discount_value,
                    isUserCoupon: true
                },
                discountAmount,
                finalAmount
            });
        }

        // 2. Nếu không tìm thấy UserCoupon, kiểm tra trong CouponModel (Coupon hệ thống)
        const coupon = await CouponModel.findOne({ code: codeClean });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Mã voucher không tồn tại.' });
        }

        const nowStr = new Date().toISOString().slice(0, 10);
        
        // Kiểm tra tính hợp lệ của thời gian và số lượng
        if (coupon.start_date > nowStr) {
            return res.status(400).json({ success: false, message: 'Mã voucher chưa đến ngày sử dụng.' });
        }
        if (coupon.end_date < nowStr) {
            return res.status(400).json({ success: false, message: 'Mã voucher đã hết hạn.' });
        }
        if (coupon.usage_limit <= 0) {
            return res.status(400).json({ success: false, message: 'Mã voucher đã hết lượt sử dụng.' });
        }

        // Kiểm tra giới hạn số lần sử dụng của một người dùng
        if (coupon.usage_limit_per_user > 0 && email) {
            const userUsedCount = await OrderModel.countDocuments({ 
                couponCode: coupon.code, 
                email: email, 
                status: { $ne: 'cancelled' }
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
            discountAmount = coupon.discount_value;
        }

        discountAmount = Math.min(discountAmount, totalAmount);
        const finalAmount = totalAmount - discountAmount;

        res.json({
            success: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                isUserCoupon: false
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
            { new: true }
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

module.exports = { getAvailableCoupons, getUserCoupons, applyCoupon, updateCoupon, deleteCoupon };

