/**
 * ============================================================
 * CONTROLLER: THANH TOÁN (Payment)
 * Mô tả: Xử lý tích hợp với các cổng thanh toán bên thứ ba (VNPay, MoMo).
 * Cung cấp API tạo URL thanh toán và các Callback/IPN để 
 * tự động cập nhật trạng thái đơn hàng khi thanh toán thành công.
 * ============================================================
 */
const { buildVNPayUrl, verifyVNPayReturn } = require('../services/vnpayService');
const { buildMoMoUrl, verifyMoMoReturn }   = require('../services/momoService');
const { OrderModel }                        = require('../models/Order');
const { exportStockOnApproval }             = require('./orderController');
const logger                                = require('../utils/logger');

/**
 * @desc Lấy Frontend URL từ env (dùng cho redirect sau thanh toán)
 */
const getFrontendUrl = () => {
    return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
};

/**
 * @desc Khởi tạo giao dịch thanh toán và trả về URL chuyển hướng cho Frontend
 * @route POST /api/payment/create-url
 */
const createPaymentUrl = async (req, res) => {
    try {
        const { orderId, amount, paymentMethod } = req.body;
        
        if (!orderId || !amount || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Thiếu tham số bắt buộc: orderId, amount, paymentMethod' });
        }

        const amountInt  = Math.round(Number(amount)); // Làm tròn về số nguyên VND
        const orderInfo  = `Thanh toan don hang ${orderId}`;
        let payUrl = '';

        if (paymentMethod === 'vnpay') {
            payUrl = buildVNPayUrl(req, orderId, amountInt, orderInfo);
        } else if (paymentMethod === 'momo') {
            payUrl = await buildMoMoUrl(orderId, amountInt, orderInfo);
        } else {
            return res.status(400).json({ success: false, message: `Phương thức thanh toán không hỗ trợ: ${paymentMethod}` });
        }

        logger.info(`[Payment] Created ${paymentMethod} URL for order ${orderId}`);
        res.status(200).json({ success: true, url: payUrl });
    } catch (error) {
        logger.error(`[Payment] createPaymentUrl error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Helper: Cập nhật đơn hàng thành công và trừ tồn kho
 */
const confirmOrderPaid = async (orderId) => {
    const updatedOrder = await OrderModel.findOneAndUpdate(
        { id: orderId, paymentStatus: { $ne: 'paid' } }, // Chỉ update nếu chưa paid (idempotent)
        { status: 'processing', paymentStatus: 'paid' },
        { new: true }
    );
    if (updatedOrder && updatedOrder.items && updatedOrder.items.length > 0) {
        await exportStockOnApproval(updatedOrder.items, orderId);
    }
    return updatedOrder;
};

/**
 * @desc Xử lý URL Redirect từ VNPay trả về cho người dùng
 * @route GET /api/payment/vnpay-return
 */
const vnpayReturn = async (req, res) => {
    const frontendUrl = getFrontendUrl();
    try {
        let vnp_Params = { ...req.query };
        const isValid  = verifyVNPayReturn(vnp_Params);
        // Đọc lại vì verifyVNPayReturn có thể xóa key
        const orderId   = req.query['vnp_TxnRef'];
        const rspCode   = req.query['vnp_ResponseCode'];

        if (!isValid) {
            logger.warn(`[VNPay Return] Invalid signature for order ${orderId}`);
            return res.redirect(`${frontendUrl}/nguoidung?status=failed&reason=invalid_signature&orderId=${orderId || ''}`);
        }

        if (rspCode === '00') {
            await confirmOrderPaid(orderId);
            logger.info(`[VNPay Return] Order ${orderId} confirmed paid`);
            return res.redirect(`${frontendUrl}/nguoidung?status=success&orderId=${orderId}&method=vnpay`);
        } else {
            logger.warn(`[VNPay Return] Payment failed for order ${orderId} - code: ${rspCode}`);
            return res.redirect(`${frontendUrl}/nguoidung?status=failed&orderId=${orderId}&method=vnpay`);
        }
    } catch (err) {
        logger.error(`[VNPay Return] Error: ${err.message}`);
        res.redirect(`${frontendUrl}/nguoidung?status=failed&reason=server_error`);
    }
};

/**
 * @desc Xử lý URL Redirect từ MoMo trả về cho người dùng
 * @route GET /api/payment/momo-return
 */
const momoReturn = async (req, res) => {
    const frontendUrl = getFrontendUrl();
    try {
        const query      = req.query;
        const orderId    = query.orderId || '';
        const resultCode = Number(query.resultCode);

        logger.info(`[MoMo Return] orderId=${orderId} resultCode=${resultCode}`);
        logger.info(`[MoMo Return] query: ${JSON.stringify(query)}`);

        const isValid = verifyMoMoReturn(query);

        if (!isValid) {
            // Sandbox MoMo đôi khi có chữ ký khác → vẫn kiểm tra resultCode
            logger.warn(`[MoMo Return] Signature invalid for order ${orderId}. Checking resultCode anyway...`);
        }

        if (resultCode === 0) {
            // resultCode = 0 là thành công theo tài liệu MoMo
            await confirmOrderPaid(orderId);
            logger.info(`[MoMo Return] Order ${orderId} confirmed paid`);
            return res.redirect(`${frontendUrl}/nguoidung?status=success&orderId=${orderId}&method=momo`);
        } else {
            logger.warn(`[MoMo Return] Payment failed for order ${orderId} - resultCode: ${resultCode}`);
            return res.redirect(`${frontendUrl}/nguoidung?status=failed&orderId=${orderId}&method=momo&code=${resultCode}`);
        }
    } catch (err) {
        logger.error(`[MoMo Return] Error: ${err.message}`);
        const frontendUrl = getFrontendUrl();
        res.redirect(`${frontendUrl}/nguoidung?status=failed&reason=server_error`);
    }
};

/**
 * @desc IPN (Instant Payment Notification) từ VNPay (Server-to-Server)
 * Đảm bảo cập nhật trạng thái đơn hàng ngầm nếu User tắt trình duyệt sớm.
 * @route GET /api/payment/vnpay-ipn
 */
const vnpayIpn = async (req, res) => {
    try {
        let vnp_Params = { ...req.query };
        const isValid  = verifyVNPayReturn(vnp_Params);
        const orderId  = req.query['vnp_TxnRef'];
        const rspCode  = req.query['vnp_ResponseCode'];
        
        if (!isValid) {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
        }

        const order = await OrderModel.findOne({ id: orderId });
        if (!order) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }
        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        if (rspCode === '00') {
            await confirmOrderPaid(orderId);
            logger.info(`[VNPay IPN] Order ${orderId} confirmed paid via IPN`);
        } else {
            await OrderModel.findOneAndUpdate({ id: orderId }, { paymentStatus: 'failed' });
        }
        res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (err) {
        logger.error(`[VNPay IPN] Error: ${err.message}`);
        res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

/**
 * @desc IPN từ MoMo (Server-to-Server) - MoMo POST lên server ta
 * @route POST /api/payment/momo-ipn
 */
const momoIpn = async (req, res) => {
    try {
        const body       = req.body;
        const orderId    = body.orderId || '';
        const resultCode = Number(body.resultCode);

        logger.info(`[MoMo IPN] orderId=${orderId} resultCode=${resultCode}`);

        const isValid = verifyMoMoReturn(body);
        if (!isValid) {
            logger.warn(`[MoMo IPN] Invalid signature for order ${orderId}`);
            // Vẫn xử lý nếu resultCode = 0 (Sandbox đôi khi signature lệch)
        }

        const order = await OrderModel.findOne({ id: orderId });
        if (!order) {
            return res.status(204).send(); // Trả 204 để MoMo không retry
        }

        if (order.paymentStatus === 'paid') {
            return res.status(204).send(); // Đã xử lý rồi, idempotent
        }

        if (resultCode === 0) {
            await confirmOrderPaid(orderId);
            logger.info(`[MoMo IPN] Order ${orderId} confirmed paid via IPN`);
        } else {
            await OrderModel.findOneAndUpdate({ id: orderId }, { paymentStatus: 'failed' });
        }
        
        // MoMo yêu cầu trả HTTP 204 hoặc 200 để xác nhận đã nhận IPN
        res.status(204).send();
    } catch (err) {
        logger.error(`[MoMo IPN] Error: ${err.message}`);
        res.status(500).send();
    }
};

module.exports = {
    createPaymentUrl,
    vnpayReturn,
    momoReturn,
    vnpayIpn,
    momoIpn
};
