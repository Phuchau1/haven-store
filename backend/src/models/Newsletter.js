const mongoose = require('mongoose');

/**
 * Newsletter Schema - Lưu danh sách email đăng ký nhận tin & nhận ưu đãi
 */
const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Vui lòng nhập địa chỉ email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    status: {
        type: String,
        enum: ['active', 'unsubscribed'],
        default: 'active'
    },
    coupon_code: {
        type: String,
        default: 'WELCOME10'
    },
    discount_percent: {
        type: Number,
        default: 10
    },
    source: {
        type: String,
        default: 'home_banner'
    },
    ip_address: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Newsletter = mongoose.models.Newsletter || mongoose.model('Newsletter', newsletterSchema);

module.exports = Newsletter;
