/**
 * ============================================================
 * CONTROLLER: AI ENTERPRISE SUITE ENDPOINTS
 * ============================================================
 */

const aiEnterpriseEngine = require('../services/aiEnterpriseEngine');
const logger             = require('../utils/logger');

/**
 * @route   POST /api/ai-enterprise/generate-description
 * @desc    AI Copywriter — Viết mô tả sản phẩm chuẩn SEO
 */
exports.generateDescription = async (req, res) => {
    try {
        const { productTitle, category, features } = req.body;
        if (!productTitle) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên sản phẩm.' });
        }
        const result = await aiEnterpriseEngine.generateProductDescription(productTitle, category, features);
        return res.json({ success: true, data: result });
    } catch (err) {
        logger.error(`[AIEnterpriseController:generateDescription] Error: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Lỗi sinh mô tả AI.' });
    }
};

/**
 * @route   POST /api/ai-enterprise/detect-fraud
 * @desc    AI Fraud Check — Đánh giá rủi ro gian lận đơn hàng
 */
exports.detectFraud = async (req, res) => {
    try {
        const orderData = req.body;
        const analysis = aiEnterpriseEngine.detectOrderFraud(orderData);
        return res.json({ success: true, data: analysis });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @route   POST /api/ai-enterprise/forecast-demand
 * @desc    AI Demand Forecast — Dự báo nhu cầu tồn kho theo SKU
 */
exports.forecastDemand = async (req, res) => {
    try {
        const { sku, currentStock, pastSales30Days } = req.body;
        if (!sku) {
            return res.status(400).json({ success: false, message: 'Thiếu mã SKU.' });
        }
        const forecast = aiEnterpriseEngine.forecastInventoryDemand(sku, currentStock, pastSales30Days);
        return res.json({ success: true, data: forecast });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
