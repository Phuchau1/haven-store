const validateOrder = (req, res, next) => {
    const { customerName, phone, email, address, paymentMethod, items, totalAmount } = req.body;
    
    if (req.method === 'POST') {
        if (!customerName || typeof customerName !== 'string') {
            return res.status(400).json({ success: false, message: 'Tên khách hàng không hợp lệ' });
        }
        if (!phone || typeof phone !== 'string') {
            return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ' });
        }
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
        }
        if (!address || typeof address !== 'string') {
            return res.status(400).json({ success: false, message: 'Địa chỉ giao hàng không hợp lệ' });
        }
        if (!paymentMethod || typeof paymentMethod !== 'string') {
            return res.status(400).json({ success: false, message: 'Phương thức thanh toán không hợp lệ' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Giỏ hàng trống hoặc không hợp lệ' });
        }
        if (totalAmount === undefined || typeof totalAmount !== 'number' || totalAmount < 0) {
            return res.status(400).json({ success: false, message: 'Tổng số tiền không hợp lệ' });
        }
    } else if (req.method === 'PUT') {
        const { id, status } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID đơn hàng' });
        }
        if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ' });
        }
    }
    next();
};

module.exports = { validateOrder };
