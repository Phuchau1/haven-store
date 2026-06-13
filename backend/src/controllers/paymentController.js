const { buildVNPayUrl, verifyVNPayReturn } = require('../services/vnpayService');
const { buildMoMoUrl, verifyMoMoReturn } = require('../services/momoService');
const { OrderModel } = require('../models/Order');

const createPaymentUrl = async (req, res) => {
    try {
        const { orderId, amount, paymentMethod } = req.body;
        
        if (!orderId || !amount || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }

        let payUrl = '';
        const orderInfo = `Thanh toan don hang ${orderId}`;

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

const vnpayReturn = async (req, res) => {
    let vnp_Params = req.query;
    const isValid = verifyVNPayReturn(vnp_Params);
    
    if (isValid) {
        let orderId = vnp_Params['vnp_TxnRef'];
        let rspCode = vnp_Params['vnp_ResponseCode'];
        
        if (rspCode === '00') {
            // Thanh toán thành công
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

const momoReturn = async (req, res) => {
    let query = req.query;
    const isValid = verifyMoMoReturn(query);
    
    if (isValid) {
        let orderId = query.orderId;
        let resultCode = query.resultCode;
        
        if (resultCode == 0) { // MoMo success code is 0
            await OrderModel.findOneAndUpdate({ id: orderId }, { status: 'processing', paymentStatus: 'paid' });
            res.redirect(`${process.env.MOMO_RETURN_URL}?status=success&orderId=${orderId}`);
        } else {
            res.redirect(`${process.env.MOMO_RETURN_URL}?status=failed&orderId=${orderId}`);
        }
    } else {
        res.redirect(`${process.env.MOMO_RETURN_URL}?status=failed&reason=invalid_signature`);
    }
};

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

const momoIpn = async (req, res) => {
    let query = req.body;
    const isValid = verifyMoMoReturn(query); // Mặc dù IPN có chữ ký riêng nhưng logic verify cơ bản giống nhau
    
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
            res.status(204).send();
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
