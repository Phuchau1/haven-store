/**
 * ============================================================
 * SERVICE: ENTERPRISE CRM 360 ENGINE
 * Mô tả: Phân tích Customer Lifetime Value (CLV), Phân nhóm khách hàng (Segmentation),
 *        Tính tần suất mua hàng (Purchase Frequency), Gợi ý quà sinh nhật & Referral System.
 * ============================================================
 */

const { UserModel } = require('../models/User');
const OrderModel    = require('../models/Order');
const logger        = require('../utils/logger');

/**
 * @desc Tính toán toàn bộ chỉ số CRM 360 cho 1 khách hàng
 */
async function calculateCustomer360(userId) {
    try {
        const user = await UserModel.findOne({ id: userId }).lean();
        if (!user) return null;

        // Lấy toàn bộ đơn hàng của khách
        const orders = await OrderModel.find({ 
            $or: [{ userId: userId }, { email: user.email }] 
        }).sort({ createdAt: -1 }).lean();

        const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'refunded');
        const totalOrders = completedOrders.length;
        
        // Tổng chi tiêu (CLV Raw)
        const totalSpent = completedOrders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
        
        // Giá trị trung bình đơn hàng (AOV)
        const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

        // Ngày mua gần nhất
        const lastOrderDate = orders.length > 0 ? new Date(orders[0].createdAt) : null;
        
        // Tần suất mua hàng (ngày)
        let purchaseFrequencyDays = 0;
        if (totalOrders > 1 && lastOrderDate && orders[orders.length - 1].createdAt) {
            const firstOrderDate = new Date(orders[orders.length - 1].createdAt);
            const daysDiff = (lastOrderDate.getTime() - firstOrderDate.getTime()) / (1000 * 3600 * 24);
            purchaseFrequencyDays = Number((daysDiff / (totalOrders - 1)).toFixed(1));
        }

        // Điểm số CLV (Scale 0 - 100)
        let clvScore = 50;
        if (totalSpent >= 20000000) clvScore += 30;
        else if (totalSpent >= 5000000) clvScore += 20;
        else if (totalSpent >= 2000000) clvScore += 10;

        if (totalOrders >= 10) clvScore += 15;
        else if (totalOrders >= 5) clvScore += 10;

        // Đánh giá rủi ro rời bỏ (Churn Risk)
        let customerSegment = 'NEW_CUSTOMER';
        const now = new Date();
        const daysSinceLastOrder = lastOrderDate ? (now.getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24) : 999;

        if (totalSpent >= 20000000 || totalOrders >= 15) {
            customerSegment = 'VIP_PLATINUM';
        } else if (totalSpent >= 8000000) {
            customerSegment = 'VIP_GOLD';
        } else if (daysSinceLastOrder > 90 && totalOrders > 0) {
            customerSegment = 'CHURN_RISK_HIGH';
        } else if (daysSinceLastOrder > 45 && totalOrders > 0) {
            customerSegment = 'CHURN_RISK_LOW';
        } else if (totalOrders >= 3) {
            customerSegment = 'LOYAL_REGULAR';
        }

        // Đề xuất thẻ (Tags)
        const tags = [customerSegment];
        if (totalSpent >= 10000000) tags.push('HIGH_SPENDER');
        if (purchaseFrequencyDays > 0 && purchaseFrequencyDays <= 14) tags.push('FREQUENT_BUYER');

        return {
            userId,
            userProfile: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                createdAt: user.createdAt
            },
            crmMetrics: {
                totalOrders,
                totalSpent,
                averageOrderValue,
                lastOrderDate,
                daysSinceLastOrder: lastOrderDate ? Math.round(daysSinceLastOrder) : null,
                purchaseFrequencyDays,
                clvScore: Math.min(100, clvScore),
                customerSegment,
                tags
            },
            recentOrders: orders.slice(0, 5)
        };
    } catch (err) {
        logger.error(`[CRMEngine:calculateCustomer360] Error: ${err.message}`);
        throw err;
    }
}

/**
 * @desc Xử lý nhập mã giới thiệu bạn bè (Referral Code)
 */
async function processReferral(userId, referralCode) {
    if (!userId || !referralCode) throw new Error('Thiếu thông tin giới thiệu');

    const referrer = await UserModel.findOne({ id: referralCode }).lean();
    if (!referrer) throw new Error('Mã giới thiệu không tồn tại!');

    if (referrer.id === userId) throw new Error('Bạn không thể tự giới thiệu chính mình!');

    return {
        success: true,
        message: `Đã áp dụng mã giới thiệu thành công từ ${referrer.name || 'người giới thiệu'}! Bạn và người giới thiệu sẽ nhận được voucher 50.000đ khi hoàn tất đơn đầu tiên.`,
        referrerId: referrer.id
    };
}

module.exports = {
    calculateCustomer360,
    processReferral
};
