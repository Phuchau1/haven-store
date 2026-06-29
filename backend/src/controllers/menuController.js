/**
 * ============================================================
 * CONTROLLER: THANH ĐIỀU HƯỚNG (Menu)
 * Mô tả: Lấy danh sách các liên kết (Menu) để hiển thị trên
 *        thanh điều hướng (Header/Navbar) của ứng dụng Frontend.
 * ============================================================
 */
const { MenuModel } = require('../models/Menu');

/**
 * @desc Lấy danh sách Menu
 * @route GET /api/menus
 */
const getMenus = async (req, res, next) => {
    try {
        const { active } = req.query;
        let query = {};
        
        // Nếu Frontend truyền ?active=true, chỉ lấy menu đang được bật
        if (active === 'true') {
            query.isActive = true;
        }

        // Sắp xếp tăng dần theo trường 'order' để hiển thị đúng thứ tự từ trái qua phải
        const menus = await MenuModel.find(query).sort({ order: 1 });
        res.json({ success: true, menus });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMenus
};
