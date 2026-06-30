const crypto = require('crypto');

const buildMoMoUrl = async (orderId, amount, orderInfo) => {
    let partnerCode = process.env.MOMO_PARTNER_CODE;
    let accessKey = process.env.MOMO_ACCESS_KEY;
    let secretKey = process.env.MOMO_SECRET_KEY;
    let returnUrl = process.env.MOMO_RETURN_URL;
    let endpoint = process.env.MOMO_API_URL;
    let notifyUrl = process.env.MOMO_IPN_URL || returnUrl.replace('momo-return', 'momo-ipn');

    if (!partnerCode || !secretKey || !accessKey) {
        throw new Error('Chưa cấu hình MoMo trên server (thiếu MOMO_PARTNER_CODE hoặc MOMO_SECRET_KEY).');
    }

    let requestId = orderId + new Date().getTime();
    let requestType = "payWithATM"; // Chuyển thẳng vào trang nhập thẻ ATM thay vì quét mã QR
    let extraData = "";

    let rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData +
        "&ipnUrl=" + notifyUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo +
        "&partnerCode=" + partnerCode + "&redirectUrl=" + returnUrl +
        "&requestId=" + requestId + "&requestType=" + requestType;

    let signature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        accessKey: accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: returnUrl,
        ipnUrl: notifyUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: 'vi'
    });

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            body: requestBody
        });
        
        const data = await response.json();
        if (data && data.payUrl) {
            return data.payUrl;
        } else {
            console.error("MoMo Error:", data);
            throw new Error(data.message || 'MoMo payment url creation failed');
        }
    } catch (error) {
        console.error("MoMo Fetch Error:", error);
        throw error;
    }
};

const verifyMoMoReturn = (query) => {
    let partnerCode = process.env.MOMO_PARTNER_CODE;
    let accessKey = process.env.MOMO_ACCESS_KEY;
    let secretKey = process.env.MOMO_SECRET_KEY;

    let amount = query.amount || "";
    let extraData = query.extraData || "";
    let message = query.message || "";
    let orderId = query.orderId || "";
    let orderInfo = query.orderInfo || "";
    let orderType = query.orderType || "";
    let qPartnerCode = query.partnerCode || "";
    let payType = query.payType || "";
    let requestId = query.requestId || "";
    let responseTime = query.responseTime || "";
    let resultCode = query.resultCode || "";
    let transId = query.transId || "";
    let signature = query.signature || "";

    let rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${qPartnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    let checkSignature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    return signature === checkSignature;
};

module.exports = {
    buildMoMoUrl,
    verifyMoMoReturn
};
