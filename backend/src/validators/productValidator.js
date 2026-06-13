const validateProduct = (req, res, next) => {
    const { name, price, category, categoryLabel, description } = req.body;
    
    if (req.method === 'POST') {
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ success: false, message: 'Tên sản phẩm không hợp lệ' });
        }
        if (price === undefined || typeof price !== 'number' || price < 0) {
            return res.status(400).json({ success: false, message: 'Giá sản phẩm không hợp lệ' });
        }
        if (!category || typeof category !== 'string') {
            return res.status(400).json({ success: false, message: 'Danh mục sản phẩm không hợp lệ' });
        }
        if (!categoryLabel || typeof categoryLabel !== 'string') {
            return res.status(400).json({ success: false, message: 'Nhãn danh mục không hợp lệ' });
        }
        if (description === undefined || typeof description !== 'string') {
            return res.status(400).json({ success: false, message: 'Mô tả sản phẩm không hợp lệ' });
        }
    } else if (req.method === 'PUT') {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID sản phẩm cần cập nhật' });
        }
    }
    next();
};

module.exports = { validateProduct };
