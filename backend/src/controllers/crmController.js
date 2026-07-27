/**
 * ============================================================
 * CONTROLLER: ENTERPRISE CRM 360 & MARKETING AUTOMATION
 * ============================================================
 */

const crmEngine = require('../services/crmEngine');
const logger    = require('../utils/logger');

/**
 * @route   GET /api/crm/customers/:userId/360
 * @desc    Lấy toàn bộ góc nhìn CRM 360 của khách hàng
 */
exports.getCustomer360 = async (req, res) => {
    try {
        const { userId } = req.params;
        const crmData = await crmEngine.calculateCustomer360(userId);
        if (!crmData) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }
        return res.json({ success: true, data: crmData });
    } catch (err) {
        logger.error(`[CRMController:getCustomer360] Error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message || 'Lỗi server CRM' });
    }
};

/**
 * @route   POST /api/crm/referral/claim
 * @desc    Áp dụng mã giới thiệu bạn bè
 */
exports.claimReferral = async (req, res) => {
    try {
        const { userId, referralCode } = req.body;
        const result = await crmEngine.processReferral(userId, referralCode);
        return res.json(result);
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};
