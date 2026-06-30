const crypto = require('crypto');
const querystring = require('querystring');

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

const buildVNPayUrl = (req, orderId, amount, orderInfo) => {
    let tmnCode = process.env.VNP_TMN_CODE;
    let secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;
    let returnUrl = process.env.VNP_RETURN_URL;
    let ipnUrl = process.env.VNP_IPN_URL || '';

    if (!tmnCode || !secretKey) {
        throw new Error('Chưa cấu hình VNPay trên server (thiếu VNP_TMN_CODE hoặc VNP_HASH_SECRET).');
    }

    function getVNPayDate() {
        const d = new Date();
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const vnTime = new Date(utc + (3600000 * 7));
        const pad = (n) => n < 10 ? '0' + n : n;
        return vnTime.getFullYear().toString() + 
               pad(vnTime.getMonth() + 1) + 
               pad(vnTime.getDate()) +
               pad(vnTime.getHours()) + 
               pad(vnTime.getMinutes()) + 
               pad(vnTime.getSeconds());
    }
    
    let createDate = getVNPayDate();
    let ipAddr = '127.0.0.1'; // Bắt buộc định dạng IPv4
    let currCode = 'VND';
    let vnp_Params = {};
    
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Amount'] = Math.round(amount * 100);
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_TxnRef'] = orderId;
    // Thêm IPN URL trực tiếp trong request (không cần cấu hình trên Merchant Admin)
    if (ipnUrl) {
        vnp_Params['vnp_IpnUrl'] = ipnUrl;
    }

    vnp_Params = sortObject(vnp_Params);

    // Build chuỗi ký đúng chuẩn VNPay
    let signData = Object.keys(vnp_Params)
        .map(key => `${key}=${vnp_Params[key]}`)
        .join('&');
    
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;
    
    vnpUrl += '?' + signData + '&vnp_SecureHash=' + signed;

    return vnpUrl;
};

const verifyVNPayReturn = (vnp_Params) => {
    let secureHash = vnp_Params['vnp_SecureHash'];
    let secretKey = process.env.VNP_HASH_SECRET;

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    let signData = "";
    let i = 0;
    for (let key in vnp_Params) {
        if (vnp_Params.hasOwnProperty(key)) {
            if (i > 0) { signData += '&'; }
            signData += key + '=' + vnp_Params[key];
            i++;
        }
    }
    
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");     

    return secureHash === signed;
};

module.exports = {
    buildVNPayUrl,
    verifyVNPayReturn
};
