/**
 * ============================================================
 * CONTROLLER: ĐỊA CHỈ (Address)
 * Mô tả: Xử lý quản lý sổ địa chỉ (Address Book) của người dùng.
 *        Cho phép thêm, sửa, xóa và thiết lập địa chỉ mặc định.
 * ============================================================
 */
const { AddressModel } = require('../models/Address');

/**
 * @desc Lấy danh sách địa chỉ của một người dùng
 */
exports.getAddresses = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id' });

        const addresses = await AddressModel.find({ user_id });
        res.status(200).json({ success: true, addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Thêm một địa chỉ mới
 */
exports.addAddress = async (req, res) => {
    try {
        const { user_id, full_name, phone, street, ward, district, city, is_default } = req.body;
        if (!user_id || !full_name || !phone || !city) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        // Nếu người dùng chọn đây là địa chỉ mặc định, bỏ mặc định ở tất cả địa chỉ cũ
        if (is_default) {
            await AddressModel.updateMany({ user_id }, { is_default: false });
        }

        const newAddress = new AddressModel({
            id: `addr-${Math.random().toString(36).substr(2, 9)}`,
            user_id,
            full_name,
            phone,
            street,
            ward,
            district,
            city,
            is_default: is_default || false
        });

        await newAddress.save();
        res.status(201).json({ success: true, address: newAddress });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Cập nhật thông tin địa chỉ
 */
exports.updateAddress = async (req, res) => {
    try {
        const { id, user_id, is_default, ...data } = req.body;
        if (!id || !user_id) return res.status(400).json({ success: false, message: 'Thiếu id' });

        // Tương tự hàm thêm, nếu chọn làm mặc định thì xóa cờ mặc định của các địa chỉ cũ
        if (is_default) {
            await AddressModel.updateMany({ user_id }, { is_default: false });
            data.is_default = true;
        }

        const address = await AddressModel.findOneAndUpdate({ id, user_id }, data, { new: true });
        if (!address) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });

        res.status(200).json({ success: true, address });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Xóa địa chỉ
 */
exports.deleteAddress = async (req, res) => {
    try {
        const { id, user_id } = req.query;
        if (!id || !user_id) return res.status(400).json({ success: false, message: 'Thiếu id' });

        const address = await AddressModel.findOneAndDelete({ id, user_id });
        if (!address) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });

        res.status(200).json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
