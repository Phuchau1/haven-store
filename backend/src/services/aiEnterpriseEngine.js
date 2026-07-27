/**
 * ============================================================
 * SERVICE: AI ENTERPRISE SUITE
 * Mô tả: Cung cấp 3 công cụ AI nâng cao:
 *   1. AI SEO Copywriter (Tự động viết mô tả sản phẩm chuẩn SEO)
 *   2. AI Fraud Detection (Đánh giá rủi ro gian lận đơn hàng 0-100%)
 *   3. AI Inventory Demand Forecast (Dự báo nhu cầu hàng tồn kho)
 * ============================================================
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

/**
 * @desc 1. AI SEO Copywriter — Tự động sinh mô tả sản phẩm chuẩn SEO
 */
async function generateProductDescription(productTitle, category, features = []) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY;
    
    let aiContent = '';

    if (apiKey) {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            
            const prompt = `
Bạn là Copywriter E-Commerce đẳng cấp thế giới chuyên ngành thời trang.
Hãy viết mô tả sản phẩm hấp dẫn, chuẩn SEO (có thẻ H2, Bullet Points, Lời khuyên phối đồ và Hướng dẫn bảo quản) cho sản phẩm sau:
- Tên sản phẩm: ${productTitle}
- Danh mục: ${category}
- Điểm nổi bật: ${features.join(', ') || 'Chất liệu cao cấp, phom dáng chuẩn, bền đẹp'}

Định dạng trả về Markdown đẹp mắt, thu hút người mua hàng.
            `;

            const res = await model.generateContent(prompt);
            aiContent = res.response.text();
        } catch (err) {
            logger.warn(`[AIEnterprise:Copywriter] Gemini API failed: ${err.message}`);
        }
    }

    if (!aiContent) {
        aiContent = `## ${productTitle} — Phong Cách Đỉnh Cao & Đẳng Cấp

### 🌟 Đặc điểm nổi bật
- **Chất liệu cao cấp**: Thiết kế với chất vải mềm mịn, thoáng khí, co giãn tốt mang lại cảm giác thoải mái suốt ngày dài.
- **Phom dáng chuẩn đẹp**: Đường may tỉ mỉ, tôn dáng tự nhiên, phù hợp nhiều vóc dáng.
- **Dễ dàng phối đồ**: Kết hợp linh hoạt với quần jeans, quần âu hoặc chân váy cho phong cách từ năng động đến sang trọng.

### 💡 Hướng dẫn bảo quản
- Giặt máy ở chế độ nhẹ hoặc giặt tay với nước lạnh.
- Tránh sử dụng chất tẩy rửa mạnh.
- Phơi ở nơi khô ráo, tránh ánh nắng trực tiếp.`;
    }

    return {
        title: productTitle,
        seoTitle: `${productTitle} | Thời Trang Cao Cấp Haven Store`,
        metaDescription: `Mua ngay ${productTitle} chất liệu cao cấp, thiết kế hiện đại tại Haven Store. Giao hàng toàn quốc, đổi trả dễ dàng trong 7 ngày.`,
        descriptionMarkdown: aiContent
    };
}

/**
 * @desc 2. AI Fraud Detection — Phân tích rủi ro gian lận đơn hàng (0 - 100%)
 */
function detectOrderFraud(orderData = {}) {
    let riskScore = 0;
    const riskFactors = [];

    const { finalAmount = 0, paymentMethod = 'COD', phone = '', address = '', itemsCount = 1 } = orderData;

    // 1. Kiểm tra đơn COD giá trị rất cao
    if (paymentMethod === 'COD' && finalAmount >= 5000000) {
        riskScore += 35;
        riskFactors.push('Đơn hàng COD giá trị cao (trên 5 triệu)');
    }

    // 2. Số lượng món bất thường
    if (itemsCount >= 15) {
        riskScore += 25;
        riskFactors.push('Số lượng sản phẩm trong đơn lớn bất thường (>15 món)');
    }

    // 3. Địa chỉ/SĐT sơ sài
    if (!phone || phone.length < 9) {
        riskScore += 30;
        riskFactors.push('Số điện thoại không hợp lệ');
    }

    if (!address || address.length < 10) {
        riskScore += 20;
        riskFactors.push('Địa chỉ giao hàng quá ngắn hoặc thiếu thông tin');
    }

    // Phân loại mức độ rủi ro
    let riskLevel = 'LOW';
    if (riskScore >= 60) riskLevel = 'HIGH';
    else if (riskScore >= 30) riskLevel = 'MEDIUM';

    return {
        riskScore: Math.min(100, riskScore),
        riskLevel,
        isSuspicious: riskScore >= 50,
        riskFactors: riskFactors.length > 0 ? riskFactors : ['Đơn hàng hợp lệ, rủi ro thấp']
    };
}

/**
 * @desc 3. AI Demand Forecast — Dự báo nhu cầu tồn kho theo SKU
 */
function forecastInventoryDemand(sku, currentStock = 100, pastSales30Days = 45) {
    // Tốc độ bán trung bình hàng ngày (Run-rate)
    const dailySalesRate = Number((pastSales30Days / 30).toFixed(2));
    
    // Dự báo số ngày hết hàng còn lại (Days of Inventory)
    const daysUntilStockout = dailySalesRate > 0 ? Math.round(currentStock / dailySalesRate) : 999;
    
    // Nhu cầu dự báo 30 ngày tới (+15% dự phòng tăng trưởng)
    const forecastedDemand30Days = Math.round(pastSales30Days * 1.15);

    // Mức reorder khuyến nghị
    const recommendedReorderQty = Math.max(0, forecastedDemand30Days - currentStock);

    let status = 'HEALTHY';
    if (daysUntilStockout <= 7) status = 'CRITICAL_LOW';
    else if (daysUntilStockout <= 15) status = 'WARNING_LOW';
    else if (daysUntilStockout > 90) status = 'OVERSTOCKED';

    return {
        sku,
        currentStock,
        pastSales30Days,
        dailySalesRate,
        daysUntilStockout,
        forecastedDemand30Days,
        recommendedReorderQty,
        status
    };
}

module.exports = {
    generateProductDescription,
    detectOrderFraud,
    forecastInventoryDemand
};
