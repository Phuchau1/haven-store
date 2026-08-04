const { ShippingMethodModel } = require('../models/ShippingMethod');

/**
 * @desc    Mock API tính phí vận chuyển động
 * @route   POST /api/shipping/calculate
 * @access  Public
 */
const calculateShipping = async (req, res, next) => {
    try {
        const { province, district, totalWeight = 200, totalAmount = 0 } = req.body;

        if (!province) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin tỉnh/thành phố' });
        }

        // Nội thành TP.HCM hoặc Hà Nội làm mốc (Ví dụ: giả định kho ở TP.HCM)
        const isHCM = province.toLowerCase().includes('hồ chí minh');
        
        // Phí cơ bản
        const baseGHN = isHCM ? 20000 : 35000;
        const baseGHTK = isHCM ? 18000 : 32000;
        const baseViettel = isHCM ? 22000 : 38000;
        const baseJT = isHCM ? 15000 : 30000;

        // Phụ phí cân nặng (giả định 5k cho mỗi 500g vượt mức 500g)
        let weightSurcharge = 0;
        if (totalWeight > 500) {
            const extraWeight = totalWeight - 500;
            weightSurcharge = Math.ceil(extraWeight / 500) * 5000;
        }

        // Tạo mảng kết quả mock
        let results = [
            {
                id: 'GHN',
                name_methond: 'Giao Hàng Nhanh',
                description: 'Giao hàng nhanh toàn quốc',
                cost: baseGHN + weightSurcharge,
                estimated_time: isHCM ? '1 ngày' : '2-3 ngày',
                logo: '/images/carriers/ghn.png' // tuỳ chọn
            },
            {
                id: 'GHTK',
                name_methond: 'Giao Hàng Tiết Kiệm',
                description: 'Tiết kiệm chi phí',
                cost: baseGHTK + weightSurcharge,
                estimated_time: isHCM ? '1-2 ngày' : '3-4 ngày',
                logo: '/images/carriers/ghtk.png'
            },
            {
                id: 'VIETTEL',
                name_methond: 'Viettel Post',
                description: 'Chuyển phát tiêu chuẩn',
                cost: baseViettel + weightSurcharge,
                estimated_time: isHCM ? '1-2 ngày' : '3-5 ngày',
                logo: '/images/carriers/viettel.png'
            },
            {
                id: 'JT',
                name_methond: 'J&T Express',
                description: 'Giao hàng tiêu chuẩn',
                cost: baseJT + weightSurcharge,
                estimated_time: isHCM ? '1-2 ngày' : '3-4 ngày',
                logo: '/images/carriers/jt.png'
            }
        ];

        // Xử lý Freeship nếu tổng đơn >= 500k
        if (totalAmount >= 500000) {
            results = results.map(method => ({
                ...method,
                original_cost: method.cost,
                cost: 0,
                freeship_applied: true
            }));
        }

        return res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { calculateShipping };
