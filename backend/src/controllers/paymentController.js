/**
 * ============================================================
 * CONTROLLER: THANH TOÁN (Payment)
 * Mô tả: Xử lý tích hợp với các cổng thanh toán bên thứ ba (VNPay, MoMo).
 * Cung cấp API tạo URL thanh toán và các Callback/IPN để 
 * tự động cập nhật trạng thái đơn hàng khi thanh toán thành công.
 * ============================================================
 */
const { buildVNPayUrl, verifyVNPayReturn } = require('../services/vnpayService');
const { buildMoMoUrl, verifyMoMoReturn } = require('../services/momoService');
const { OrderModel } = require('../models/Order');

/**
 * @desc Khởi tạo giao dịch thanh toán và trả về URL chuyển hướng cho Frontend
 * @route POST /api/payment/create-url
 */
const createPaymentUrl = async (req, res) => {
    try {
        const { orderId, amount, paymentMethod } = req.body;
        
        if (!orderId || !amount || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }

        let payUrl = '';
        const orderInfo = `Thanh toan don hang ${orderId}`;

        // Gọi service tương ứng để mã hóa thông tin và tạo URL
        if (paymentMethod === 'vnpay') {
            payUrl = buildVNPayUrl(req, orderId, amount, orderInfo);
        } else if (paymentMethod === 'momo') {
            payUrl = await buildMoMoUrl(orderId, amount, orderInfo);
        } else {
            return res.status(400).json({ success: false, message: 'Unsupported payment method' });
        }

        res.status(200).json({ success: true, url: payUrl });
    } catch (error) {
        console.error('Create Payment URL Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Xử lý URL Redirect từ VNPay trả về cho người dùng (Frontend xử lý hiển thị)
 * @route GET /api/payment/vnpay-return
 */
const vnpayReturn = async (req, res) => {
    let vnp_Params = req.query;
    const isValid = verifyVNPayReturn(vnp_Params);
    
    if (isValid) {
        let orderId = vnp_Params['vnp_TxnRef'];
        let rspCode = vnp_Params['vnp_ResponseCode'];
        
        if (rspCode === '00') {
            // Thanh toán thành công: Cập nhật đơn hàng
            await OrderModel.findOneAndUpdate({ id: orderId }, { status: 'processing', paymentStatus: 'paid' });
            res.redirect(`${process.env.VNP_RETURN_URL}?status=success&orderId=${orderId}`);
        } else {
            // Thanh toán thất bại
            res.redirect(`${process.env.VNP_RETURN_URL}?status=failed&orderId=${orderId}`);
        }
    } else {
        res.redirect(`${process.env.VNP_RETURN_URL}?status=failed&reason=invalid_signature`);
    }
};

/**
 * @desc Xử lý URL Redirect từ MoMo trả về
 * @route GET /api/payment/momo-return
 */
const momoReturn = async (req, res) => {
    let query = req.query;
    const isValid = verifyMoMoReturn(query);
    
    if (isValid) {
        let orderId = query.orderId;
        let resultCode = query.resultCode;
        
        if (resultCode == 0) { // Mã 0 của MoMo là thành công
            await OrderModel.findOneAndUpdate({ id: orderId }, { status: 'processing', paymentStatus: 'paid' });
            res.redirect(`${process.env.MOMO_RETURN_URL}?status=success&orderId=${orderId}`);
        } else {
            res.redirect(`${process.env.MOMO_RETURN_URL}?status=failed&orderId=${orderId}`);
        }
    } else {
        res.redirect(`${process.env.MOMO_RETURN_URL}?status=failed&reason=invalid_signature`);
    }
};

/**
 * @desc IPN (Instant Payment Notification) từ VNPay (Server-to-Server)
 * Đảm bảo cập nhật trạng thái đơn hàng ngầm nếu User tắt trình duyệt sớm.
 * @route GET /api/payment/vnpay-ipn
 */
const vnpayIpn = async (req, res) => {
    let vnp_Params = req.query;
    const isValid = verifyVNPayReturn(vnp_Params);
    
    if (isValid) {
        let orderId = vnp_Params['vnp_TxnRef'];
        let rspCode = vnp_Params['vnp_ResponseCode'];
        
        try {
            const order = await OrderModel.findOne({ id: orderId });
            if (!order) return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            if (order.paymentStatus === 'paid') return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });

            if (rspCode === '00') {
                await OrderModel.findOneAndUpdate({ id: orderId }, { status: 'processing', paymentStatus: 'paid' });
            } else {
                await OrderModel.findOneAndUpdate({ id: orderId }, { paymentStatus: 'failed' });
            }
            res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } catch (e) {
            res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
        }
    } else {
        res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }
};

/**
 * @desc IPN từ MoMo (Server-to-Server)
 * @route POST /api/payment/momo-ipn
 */
const momoIpn = async (req, res) => {
    let query = req.body;
    const isValid = verifyMoMoReturn(query);
    
    if (isValid) {
        let orderId = query.orderId;
        let resultCode = query.resultCode;
        
        try {
            const order = await OrderModel.findOne({ id: orderId });
            if (order && order.paymentStatus !== 'paid') {
                if (resultCode == 0) {
                    await OrderModel.findOneAndUpdate({ id: orderId }, { status: 'processing', paymentStatus: 'paid' });
                } else {
                    await OrderModel.findOneAndUpdate({ id: orderId }, { paymentStatus: 'failed' });
                }
            }
            res.status(204).send(); // MoMo yêu cầu HTTP 204
        } catch (e) {
            res.status(500).send();
        }
    } else {
        res.status(400).send();
    }
};

module.exports = {
    createPaymentUrl,
    vnpayReturn,
    momoReturn,
    vnpayIpn,
    momoIpn
};
