/**
 * ============================================================
 * SERVICE: MoMo Payment Gateway (API v2)
 * Mô tả: Tích hợp với cổng thanh toán MoMo (Sandbox + Production).
 * Tài liệu: https://developers.momo.vn/v3/docs/payment/api/
 * ============================================================
 */
const crypto = require('crypto');

/**
 * @desc Tạo URL thanh toán MoMo và trả về payUrl để redirect user
 * @param {string} orderId - Mã đơn hàng duy nhất
 * @param {number} amount - Số tiền (VND, không có số thập phân)
 * @param {string} orderInfo - Mô tả đơn hàng
 * @returns {Promise<string>} payUrl - URL để redirect sang trang MoMo
 */
const buildMoMoUrl = async (orderId, amount, orderInfo) => {
    const partnerCode  = process.env.MOMO_PARTNER_CODE;
    const accessKey    = process.env.MOMO_ACCESS_KEY;
    const secretKey    = process.env.MOMO_SECRET_KEY;
    const redirectUrl  = process.env.MOMO_RETURN_URL;
    const ipnUrl       = process.env.MOMO_IPN_URL;
    const endpoint     = process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';

    if (!partnerCode || !accessKey || !secretKey) {
        throw new Error('Chưa cấu hình MoMo trên server (thiếu MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, hoặc MOMO_SECRET_KEY).');
    }
    if (!redirectUrl || !ipnUrl) {
        throw new Error('Chưa cấu hình MOMO_RETURN_URL hoặc MOMO_IPN_URL.');
    }

    const requestId   = `${partnerCode}${Date.now()}`;
    const requestType = 'captureWallet'; // Quét QR hoặc App MoMo
    const extraData   = '';              // Không truyền data phụ
    const lang        = 'vi';

    // ===== Tạo chữ ký HMAC-SHA256 =====
    // Thứ tự key PHẢI đúng theo tài liệu MoMo v2 (alphabetical)
    const rawSignature = [
        `accessKey=${accessKey}`,
        `amount=${amount}`,
        `extraData=${extraData}`,
        `ipnUrl=${ipnUrl}`,
        `orderId=${orderId}`,
        `orderInfo=${orderInfo}`,
        `partnerCode=${partnerCode}`,
        `redirectUrl=${redirectUrl}`,
        `requestId=${requestId}`,
        `requestType=${requestType}`,
    ].join('&');

    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    const body = {
        partnerCode,
        accessKey,
        requestId,
        amount:      String(amount),
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang,
    };

    console.log('[MoMo] Calling API:', endpoint);
    console.log('[MoMo] rawSignature:', rawSignature);

    const response = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`MoMo API HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log('[MoMo] Response:', JSON.stringify(data));

    if (data && data.payUrl) {
        return data.payUrl;
    }

    // Nếu không có payUrl, ném lỗi với thông tin cụ thể
    throw new Error(
        `MoMo trả về lỗi: [${data.resultCode}] ${data.message || 'Không rõ nguyên nhân'}`
    );
};

/**
 * @desc Xác minh chữ ký từ MoMo khi callback về (Return URL hoặc IPN)
 * @param {object} query - Query params (GET) hoặc body (POST) từ MoMo
 * @returns {boolean} true nếu chữ ký hợp lệ
 */
const verifyMoMoReturn = (query) => {
    const secretKey = process.env.MOMO_SECRET_KEY;
    const accessKey = process.env.MOMO_ACCESS_KEY;

    if (!secretKey) return false;

    const {
        accessKey:    qAccessKey   = '',
        amount        = '',
        extraData     = '',
        message       = '',
        orderId       = '',
        orderInfo     = '',
        orderType     = '',
        partnerCode   = '',
        payType       = '',
        requestId     = '',
        responseTime  = '',
        resultCode    = '',
        transId       = '',
        signature     = '',
    } = query;

    // Thứ tự key khi verify PHẢI đúng theo tài liệu MoMo
    const rawSignature = [
        `accessKey=${accessKey}`,
        `amount=${amount}`,
        `extraData=${extraData}`,
        `message=${message}`,
        `orderId=${orderId}`,
        `orderInfo=${orderInfo}`,
        `orderType=${orderType}`,
        `partnerCode=${partnerCode}`,
        `payType=${payType}`,
        `requestId=${requestId}`,
        `responseTime=${responseTime}`,
        `resultCode=${resultCode}`,
        `transId=${transId}`,
    ].join('&');

    const expected = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    const isValid = signature === expected;
    if (!isValid) {
        console.warn('[MoMo] Invalid signature!');
        console.warn('[MoMo] Expected:', expected);
        console.warn('[MoMo] Received:', signature);
        console.warn('[MoMo] Raw:', rawSignature);
    }
    return isValid;
};

module.exports = { buildMoMoUrl, verifyMoMoReturn };
