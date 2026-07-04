const mongoose = require('mongoose');

/**
 * Model lưu lịch sử sản phẩm đã xem gần đây của từng user
 */
const recentlyViewedSchema = new mongoose.Schema({
    user_id:    { type: String, required: true, index: true },
    product_id: { type: String, required: true },
    viewed_at:  { type: Date, default: Date.now }
}, { timestamps: false });

// Đảm bảo mỗi user chỉ có 1 bản ghi cho mỗi sản phẩm
recentlyViewedSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

const RecentlyViewedModel = mongoose.models.RecentlyViewed || mongoose.model('RecentlyViewed', recentlyViewedSchema);

module.exports = { RecentlyViewedModel };
