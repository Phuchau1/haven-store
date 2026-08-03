/**
 * ============================================================
 * VALIDATOR: SẢN PHẨM (Product Validator)
 * Mô tả: Kiềm tra tính hợp lệ của dữ liệu trước khi thêm/sửa sản phẩm.
 * ============================================================
 */
const validateProduct = (req, res, next) => {
    // Đảm bảo các trường dữ liệu mô tả không bao giờ bị null/undefined
    if (req.body.description === undefined || req.body.description === null) {
        req.body.description = req.body.shortDescription || '';
    }
    if (req.body.shortDescription === undefined || req.body.shortDescription === null) {
        req.body.shortDescription = req.body.description || '';
    }
    if (req.body.categoryLabel === undefined || req.body.categoryLabel === null) {
        req.body.categoryLabel = req.body.category || 'Sản phẩm';
    }

    const { name, price, category } = req.body;

    if (req.method === 'POST') {
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Tên sản phẩm không được để trống' });
        }
        if (price === undefined || typeof price !== 'number' || price < 0) {
            return res.status(400).json({ success: false, message: 'Giá sản phẩm phải là một số lớn hơn hoặc bằng 0' });
        }
        if (!category || typeof category !== 'string') {
            return res.status(400).json({ success: false, message: 'Danh mục sản phẩm không hợp lệ' });
        }
    } else if (req.method === 'PUT') {
        const { id, _id } = req.body;
        if (!id && !_id) {
            return res.status(400).json({ success: false, message: 'Thiếu mã ID sản phẩm cần cập nhật' });
        }
    }

    next();
};

module.exports = { validateProduct };
