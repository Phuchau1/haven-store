/**
 * ============================================================
 * CONTROLLER: ADMIN EXTRA (Quản lý các danh mục phụ)
 * Mô tả: Controller dùng chung để xử lý CRUD cho nhiều Model phụ
 *        giúp giảm thiểu việc phải viết Controller riêng cho từng cái.
 *        Bao gồm: Banner, Color, Size, Coupon, Phương thức Thanh toán / Vận chuyển.
 * ============================================================
 */
const { BannerModel } = require('../models/Banner');
const { ColorModel } = require('../models/Color');
const { SizeModel } = require('../models/Size');
const { CouponModel } = require('../models/Coupon');
const { PaymentMethodModel } = require('../models/PaymentMethod');
const { ShippingMethodModel } = require('../models/ShippingMethod');

/**
 * @desc Helper function: Lấy Model tương ứng dựa trên tên tài nguyên (resource param từ URL)
 */
const getModelByName = (name) => {
    switch(name) {
        case 'banners': return BannerModel;
        case 'colors': return ColorModel;
        case 'sizes': return SizeModel;
        case 'coupons': return CouponModel;
        case 'payment-methods': return PaymentMethodModel;
        case 'shipping-methods': return ShippingMethodModel;
        default: return null;
    }
};

/**
 * @desc Lấy danh sách tất cả (Get All)
 */
exports.getAll = async (req, res) => {
    try {
        const { resource } = req.params;
        const Model = getModelByName(resource);
        if (!Model) return res.status(400).json({ success: false, message: 'Tài nguyên không hợp lệ' });

        const data = await Model.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Tạo mới một bản ghi (Create)
 */
exports.create = async (req, res) => {
    try {
        const { resource } = req.params;
        const Model = getModelByName(resource);
        if (!Model) return res.status(400).json({ success: false, message: 'Tài nguyên không hợp lệ' });

        const newItem = new Model(req.body);
        await newItem.save();
        res.status(201).json({ success: true, data: newItem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Cập nhật thông tin (Update)
 */
exports.update = async (req, res) => {
    try {
        const { resource } = req.params;
        const { id } = req.query; // Nhận ID từ query string thay vì param
        
        const Model = getModelByName(resource);
        if (!Model) return res.status(400).json({ success: false, message: 'Tài nguyên không hợp lệ' });

        if (!id) return res.status(400).json({ success: false, message: 'Thiếu ID' });

        const updatedItem = await Model.findOneAndUpdate(
            { id: id },
            req.body,
            { new: true } // Trả về bản ghi mới nhất sau khi cập nhật
        );

        if (!updatedItem) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        
        res.status(200).json({ success: true, data: updatedItem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Xóa bản ghi (Delete)
 */
exports.delete = async (req, res) => {
    try {
        const { resource } = req.params;
        const { id } = req.query;
        
        const Model = getModelByName(resource);
        if (!Model) return res.status(400).json({ success: false, message: 'Tài nguyên không hợp lệ' });

        if (!id) return res.status(400).json({ success: false, message: 'Thiếu ID' });

        const deletedItem = await Model.findOneAndDelete({ id: id });
        if (!deletedItem) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

        res.status(200).json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
