/**
 * ============================================================
 * CONTROLLER: CÀI ĐẶT HỆ THỐNG (Site Setting)
 * Mô tả: Xử lý việc lấy và cập nhật các cấu hình chung của website
 *        (VD: Logo, số điện thoại hotline, địa chỉ, links mạng xã hội...)
 *        Dữ liệu được lưu dưới dạng Key-Value.
 * ============================================================
 */
const { SiteSettingModel } = require('../models/SiteSetting');

/**
 * @desc Lấy toàn bộ cấu hình hệ thống
 * @route GET /api/settings
 * @return Trả về một Object (Dictionary) dạng { "logo": "...", "hotline": "..." }
 */
const getSettings = async (req, res, next) => {
    try {
        const settings = await SiteSettingModel.find();
        if (!settings || settings.length === 0) {
            return res.json({ success: true, settings: {} });
        }

        // Chuyển đổi mảng kết quả thành Object dạng Key-Value cho Frontend dễ dùng
        const settingsMap = settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});
        res.json({ success: true, settings: settingsMap });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Cập nhật cấu hình hệ thống
 * @route PUT /api/settings
 * @note Chấp nhận body là một Object: { "key1": "value1", "key2": "value2" }
 */
const updateSettings = async (req, res, next) => {
    try {
        const updates = req.body; 
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
        }

        // Chạy Promise.all để cập nhật (Upsert: Có thì sửa, chưa có thì tạo mới) nhiều Key cùng lúc
        const promises = Object.entries(updates).map(([key, value]) => {
            return SiteSettingModel.findOneAndUpdate(
                { key },
                { value },
                { new: true, upsert: true } // Upsert quan trọng
            );
        });

        await Promise.all(promises);
        
        // Trả về dữ liệu mới nhất sau khi cập nhật
        const settings = await SiteSettingModel.find();
        const settingsMap = settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        res.json({ success: true, message: 'Cập nhật cài đặt thành công', settings: settingsMap });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSettings,
    updateSettings
};
