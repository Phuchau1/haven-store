/**
 * ============================================================
 * CONTROLLER: CARRIER SIMULATION
 * Endpoints để Admin mô phỏng quá trình giao hàng từng bước
 * ============================================================
 */
const {
    CARRIER_TEMPLATES,
    initShipping,
    advanceShippingStep,
    getOrderTimeline,
    addCustomEvent
} = require('../services/carrierSimulator');
const logger = require('../utils/logger');

/**
 * @route POST /api/carrier/init
 * @desc  Admin khởi tạo giao hàng — chọn carrier, sinh tracking number
 */
exports.initShipping = async (req, res) => {
    try {
        const { orderId, carrierCode, adminName } = req.body;
        if (!orderId || !carrierCode) {
            return res.status(400).json({ success: false, message: 'Thiếu orderId hoặc carrierCode' });
        }
        if (!CARRIER_TEMPLATES[carrierCode]) {
            return res.status(400).json({ success: false, message: `Carrier không hợp lệ. Hỗ trợ: ${Object.keys(CARRIER_TEMPLATES).join(', ')}` });
        }

        const result = await initShipping(orderId, carrierCode, adminName || 'Admin');
        return res.json({
            success: true,
            message: `✅ Đã khởi tạo giao hàng qua ${result.carrier.name}`,
            trackingNumber: result.trackingNumber,
            estimatedDelivery: result.estimatedDelivery,
            carrier: result.carrier.name
        });
    } catch (err) {
        logger.error(`[Carrier] initShipping error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @route POST /api/carrier/advance
 * @desc  Admin bấm "Tiến bước tiếp theo" — mô phỏng bước giao hàng
 */
exports.advanceStep = async (req, res) => {
    try {
        const { orderId, adminName } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Thiếu orderId' });
        }

        const result = await advanceShippingStep(orderId, adminName || 'Admin');

        if (result.done && !result.nextStep) {
            return res.json({ success: true, done: true, message: result.message });
        }

        return res.json({
            success: true,
            done: result.done,
            newStatus: result.status,
            event: result.nextStep,
            progress: `${result.completedSteps}/${result.totalSteps}`,
            message: result.done
                ? `🎉 Giao hàng thành công! Đơn #${orderId} đã hoàn tất.`
                : `✅ Bước ${result.completedSteps}/${result.totalSteps}: ${result.nextStep?.title}`
        });
    } catch (err) {
        logger.error(`[Carrier] advanceStep error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @route GET /api/carrier/timeline/:orderId
 * @desc  Lấy full tracking timeline của 1 đơn hàng (Customer + Admin)
 */
exports.getTimeline = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Thiếu orderId' });
        }

        const data = await getOrderTimeline(orderId);
        return res.json({ success: true, ...data });
    } catch (err) {
        logger.error(`[Carrier] getTimeline error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @route POST /api/carrier/add-event
 * @desc  Admin thêm custom tracking event thủ công
 */
exports.addEvent = async (req, res) => {
    try {
        const { orderId, title, location, note, status, adminName } = req.body;
        if (!orderId || !title || !status) {
            return res.status(400).json({ success: false, message: 'Thiếu orderId, title hoặc status' });
        }

        const event = await addCustomEvent(orderId, { title, location, note, status }, adminName || 'Admin');
        return res.json({ success: true, message: '✅ Đã thêm sự kiện tracking', event });
    } catch (err) {
        logger.error(`[Carrier] addEvent error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @route GET /api/carrier/carriers
 * @desc  Lấy danh sách carriers có hỗ trợ
 */
exports.getCarriers = async (req, res) => {
    const carriers = Object.values(CARRIER_TEMPLATES).map(c => ({
        code: c.code,
        name: c.name,
        color: c.color,
        estimatedDays: c.estimatedDays,
        totalSteps: c.trackingSteps.length
    }));
    return res.json({ success: true, carriers });
};
