/**
 * ============================================================
 * SERVICE: CARRIER SIMULATION ENGINE
 * Mô phỏng quá trình giao hàng của các đơn vị vận chuyển
 * GHN / GHTK / J&T / Viettel Post / BEST / Ninja Van
 * ============================================================
 */
const { OrderModel } = require('../models/Order');
const { ShippingEventModel } = require('../models/ShippingEvent');
const { refundOrderToWallet } = require('../controllers/walletController');
const { ProductVariantModel } = require('../models/ProductVariant');

const logger = require('../utils/logger');

// ─── CARRIER CONFIGS ──────────────────────────────────────────────────────────
const CARRIER_TEMPLATES = {
    GHN: {
        name: 'Giao Hàng Nhanh (GHN)',
        code: 'GHN',
        color: '#E83B34',
        estimatedDays: 2,
        trackingSteps: [
            { status: 'waiting_pickup',    title: 'Chờ lấy hàng',             location: 'Tại shop',           note: 'Đơn hàng đang chờ GHN đến lấy' },
            { status: 'picked_up',         title: 'Đã lấy hàng',              location: 'Tại shop',           note: 'GHN đã lấy hàng thành công' },
            { status: 'in_transit',        title: 'Đến kho phân loại',        location: 'Kho GHN – Q.Bình Thạnh, HCM', note: 'Hàng đang được phân loại' },
            { status: 'in_transit',        title: 'Rời kho, đang trung chuyển', location: 'Kho GHN – Q.Bình Thạnh, HCM', note: 'Đang vận chuyển đến kho địa phương' },
            { status: 'in_transit',        title: 'Đến kho địa phương',       location: 'Kho GHN – {city}',   note: 'Hàng đến kho GHN gần bạn nhất' },
            { status: 'out_for_delivery',  title: 'Shipper đang giao hàng',   location: '{city}',             note: 'Shipper đang trên đường đến địa chỉ của bạn' },
            { status: 'delivered',         title: 'Giao hàng thành công',     location: '{address}',          note: 'Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua hàng!' }
        ]
    },
    GHTK: {
        name: 'Giao Hàng Tiết Kiệm (GHTK)',
        code: 'GHTK',
        color: '#009B57',
        estimatedDays: 3,
        trackingSteps: [
            { status: 'waiting_pickup',    title: 'Chờ lấy hàng',             location: 'Tại shop',           note: 'Đơn hàng đang chờ GHTK đến lấy' },
            { status: 'picked_up',         title: 'Đã lấy hàng',              location: 'Tại shop',           note: 'GHTK đã tiếp nhận đơn hàng' },
            { status: 'in_transit',        title: 'Nhập kho bưu cục gốc',     location: 'Bưu cục GHTK – HCM', note: 'Kiểm tra và đóng gói tại bưu cục gốc' },
            { status: 'in_transit',        title: 'Xuất kho, đang vận chuyển',location: 'Trên đường',         note: 'Đang vận chuyển đường dài' },
            { status: 'in_transit',        title: 'Nhập kho bưu cục đích',    location: 'Bưu cục GHTK – {city}', note: 'Hàng đã đến bưu cục gần nhà bạn' },
            { status: 'out_for_delivery',  title: 'Phát hàng',                location: '{city}',             note: 'Nhân viên phát hàng GHTK đang giao đến bạn' },
            { status: 'delivered',         title: 'Phát hàng thành công',     location: '{address}',          note: 'Đơn hàng giao thành công. Cảm ơn bạn đã ủng hộ!' }
        ]
    },
    JNT: {
        name: 'J&T Express',
        code: 'JNT',
        color: '#E30613',
        estimatedDays: 2,
        trackingSteps: [
            { status: 'waiting_pickup',    title: 'Awaiting Pickup',           location: 'Tại shop',           note: 'J&T Express đang đến lấy hàng' },
            { status: 'picked_up',         title: 'Picked Up',                 location: 'Tại shop',           note: 'J&T Express đã lấy hàng' },
            { status: 'in_transit',        title: 'Arrived at Sorting Center', location: 'J&T Hub – Thủ Đức, HCM', note: 'Hàng đang được phân loại tại trung tâm' },
            { status: 'in_transit',        title: 'Departed Sorting Center',   location: 'J&T Hub – Thủ Đức, HCM', note: 'Hàng đã rời trung tâm phân loại' },
            { status: 'in_transit',        title: 'In Transit',                location: 'Trên đường',         note: 'Đang vận chuyển đến kho địa phương' },
            { status: 'out_for_delivery',  title: 'Out for Delivery',          location: '{city}',             note: 'Shipper J&T đang trên đường giao hàng' },
            { status: 'delivered',         title: 'Delivered Successfully',    location: '{address}',          note: 'Package delivered successfully. Thank you!' }
        ]
    },
    VTP: {
        name: 'Viettel Post',
        code: 'VTP',
        color: '#C9272B',
        estimatedDays: 3,
        trackingSteps: [
            { status: 'waiting_pickup',    title: 'Chờ lấy hàng',             location: 'Tại shop',           note: 'Viettel Post đang chuẩn bị lấy hàng' },
            { status: 'picked_up',         title: 'Lấy hàng thành công',      location: 'Tại shop',           note: 'Bưu tá Viettel Post đã tiếp nhận' },
            { status: 'in_transit',        title: 'Nhập kho gốc',             location: 'Kho Viettel Post – HCM', note: 'Hàng được kiểm tra tại bưu cục gốc' },
            { status: 'in_transit',        title: 'Vận chuyển đường dài',     location: 'Trên đường',         note: 'Hàng đang vận chuyển đường dài' },
            { status: 'in_transit',        title: 'Nhập kho điểm đến',        location: 'Kho Viettel Post – {city}', note: 'Hàng đã về kho bưu cục điểm đến' },
            { status: 'out_for_delivery',  title: 'Bưu tá đang giao hàng',   location: '{city}',             note: 'Bưu tá đang giao hàng đến địa chỉ của bạn' },
            { status: 'delivered',         title: 'Giao hàng thành công',     location: '{address}',          note: 'Bưu phẩm đã được phát thành công' }
        ]
    },
    BEST: {
        name: 'BEST Express',
        code: 'BEST',
        color: '#F5A623',
        estimatedDays: 2,
        trackingSteps: [
            { status: 'waiting_pickup',    title: 'Chờ lấy hàng',             location: 'Tại shop',           note: 'BEST Express sắp đến lấy hàng' },
            { status: 'picked_up',         title: 'Hàng đã được lấy',         location: 'Tại shop',           note: 'BEST Express đã tiếp nhận kiện hàng' },
            { status: 'in_transit',        title: 'Nhập kho BEST',            location: 'Trung tâm BEST – HCM', note: 'Hàng nhập kho và được phân loại' },
            { status: 'in_transit',        title: 'Xuất phát đến điểm đích',  location: 'Trên đường',         note: 'Đang vận chuyển đến điểm giao cuối' },
            { status: 'out_for_delivery',  title: 'Đang giao hàng',           location: '{city}',             note: 'Nhân viên BEST đang giao đến bạn' },
            { status: 'delivered',         title: 'Giao thành công',          location: '{address}',          note: 'Đơn hàng đã giao thành công!' }
        ]
    },
    NJV: {
        name: 'Ninja Van',
        code: 'NJV',
        color: '#E60B17',
        estimatedDays: 3,
        trackingSteps: [
            { status: 'waiting_pickup',    title: 'Pending Pickup',            location: 'Tại shop',           note: 'Ninja Van ninja đang lên đường đến lấy hàng' },
            { status: 'picked_up',         title: 'Parcel Picked Up',          location: 'Tại shop',           note: 'Ninja Van đã lấy hàng thành công' },
            { status: 'in_transit',        title: 'Processing at Origin Hub',  location: 'Ninja Van Hub – HCM', note: 'Kiện hàng đang được xử lý tại hub gốc' },
            { status: 'in_transit',        title: 'On the Way',                location: 'Trên đường',         note: 'Ninja Van đang vận chuyển đến điểm đích' },
            { status: 'in_transit',        title: 'Arrived at Destination Hub',location: 'Ninja Van Hub – {city}', note: 'Kiện hàng đã về hub gần bạn nhất' },
            { status: 'out_for_delivery',  title: 'Out for Delivery',          location: '{city}',             note: 'Ninja Van đang trên đường giao hàng đến bạn' },
            { status: 'delivered',         title: 'Successfully Delivered',    location: '{address}',          note: 'Delivery completed! Thank you for choosing Ninja Van.' }
        ]
    }
};

// ─── HELPER: Sinh tracking number ────────────────────────────────────────────
function generateTrackingNumber(carrierCode) {
    const prefix = { GHN: 'GHN', GHTK: 'GHTK', JNT: 'JNT', VTP: 'VTP', BEST: 'BST', NJV: 'NJV' }[carrierCode] || 'TRK';
    return `${prefix}${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2,6).toUpperCase()}`;
}

// ─── HELPER: Điền địa chỉ vào template ───────────────────────────────────────
function fillTemplate(text, order) {
    const city = order.address?.split(',').slice(-2, -1)[0]?.trim() || 'Địa phương';
    return text
        .replace('{city}', city)
        .replace('{address}', order.address?.substring(0, 40) + (order.address?.length > 40 ? '...' : '') || 'Địa chỉ nhận hàng');
}

// ─── MAIN: Khởi tạo giao hàng (Admin chọn carrier + bấm bắt đầu) ─────────────
async function initShipping(orderId, carrierCode, adminName = 'Admin') {
    const order = await OrderModel.findOne({ id: orderId });
    if (!order) throw new Error(`Không tìm thấy đơn hàng ${orderId}`);

    const carrier = CARRIER_TEMPLATES[carrierCode];
    if (!carrier) throw new Error(`Carrier không hợp lệ: ${carrierCode}`);

    const trackingNumber = generateTrackingNumber(carrierCode);
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + carrier.estimatedDays);

    // Cập nhật order với carrier info + trạng thái waiting_pickup
    const timelineEvent = {
        status: 'waiting_pickup',
        title: 'Chờ đơn vị vận chuyển lấy hàng',
        location: 'Tại shop',
        note: `Đơn hàng đã được giao cho ${carrier.name}. Mã vận đơn: ${trackingNumber}`,
        timestamp: new Date(),
        isCustomerVisible: true
    };

    await OrderModel.findOneAndUpdate(
        { id: orderId },
        {
            status: 'waiting_pickup',
            carrierCode,
            shippingProvider: carrier.name,
            trackingNumber,
            estimatedDelivery,
            $push: { shippingTimeline: timelineEvent }
        }
    );

    // Lưu ShippingEvent
    await ShippingEventModel.create({
        orderId,
        status: 'waiting_pickup',
        title: timelineEvent.title,
        location: timelineEvent.location,
        note: timelineEvent.note,
        timestamp: new Date(),
        performedBy: adminName,
        carrierCode
    });

    logger.info(`[Carrier] Khởi tạo giao hàng đơn ${orderId} qua ${carrier.name} | Tracking: ${trackingNumber}`);
    return { trackingNumber, estimatedDelivery, carrier };
}

// ─── MAIN: Admin bấm tiến 1 bước ─────────────────────────────────────────────
async function advanceShippingStep(orderId, adminName = 'Admin') {
    const order = await OrderModel.findOne({ id: orderId });
    if (!order) throw new Error(`Không tìm thấy đơn hàng ${orderId}`);

    const carrierCode = order.carrierCode || 'GHN';
    const carrier = CARRIER_TEMPLATES[carrierCode] || CARRIER_TEMPLATES.GHN;

    // Tìm bước hiện tại trong template
    const currentStatus = order.status;

    // ─────────────────────────────────────────────────────────────────
    // XỬ LÝ NẾU ĐƠN ĐANG TRONG TIẾN TRÌNH HOÀN TRẢ (RETURN FLOW)
    // ─────────────────────────────────────────────────────────────────
    if (['return_requested', 'returning', 'return_received'].includes(currentStatus)) {
        let nextReturnStatus = 'returning';
        let returnTitle = 'Khách gửi hàng trả về shop';
        let returnNote = 'Đơn vị vận chuyển đang trung chuyển hàng trả về kho Shop';

        if (currentStatus === 'return_requested') {
            nextReturnStatus = 'returning';
            returnTitle = 'Duyệt hoàn hàng — Đang gửi hàng trả về shop';
            returnNote = 'Shop đã chấp thuận. Khách hàng đang gửi lại sản phẩm về kho.';
        } else if (currentStatus === 'returning') {
            nextReturnStatus = 'return_received';
            returnTitle = 'Shop lấy / nhận hàng trả về kho thành công';
            returnNote = 'Kiện hàng hoàn trả đã đến kho Shop và kiểm kê đầy đủ.';
        } else if (currentStatus === 'return_received') {
            nextReturnStatus = 'refunded';
            returnTitle = 'Đã hoàn tiền thành công vào Ví HAVEN';
            returnNote = `Tiền hoàn ${(order.finalAmount || order.totalAmount).toLocaleString('vi-VN')} đ đã tự động chuyển vào Ví HAVEN của người dùng.`;
        }

        const timestamp = new Date();
        const timelineEvent = {
            status: nextReturnStatus,
            title: returnTitle,
            location: 'Kho HAVEN Store',
            note: returnNote,
            timestamp,
            isCustomerVisible: true
        };

        await OrderModel.findOneAndUpdate(
            { id: orderId },
            {
                status: nextReturnStatus,
                $push: { shippingTimeline: timelineEvent }
            }
        );

        await ShippingEventModel.create({
            orderId,
            status: nextReturnStatus,
            title: returnTitle,
            location: 'Kho HAVEN Store',
            note: returnNote,
            timestamp,
            performedBy: adminName,
            carrierCode
        });

        // 🟢 NẾU TIẾN ĐẾN REFUNDED -> THỰC HIỆN CỘNG TIỀN VÀO VÍ NGƯỜI DÙNG & HOÀN KHO VẬT LÝ
        if (nextReturnStatus === 'refunded') {
            const refundAmt = order.finalAmount || order.totalAmount || 0;
            try {
                // Restock vật lý
                if (order.items && order.items.length > 0) {
                    for (const item of order.items) {
                        await ProductVariantModel.findOneAndUpdate(
                            { product_id: item.product.id, size_id: item.selectedSize, color_id: item.selectedColor.name },
                            { $inc: { stock: item.quantity } }
                        );
                    }
                }
                // Cộng tiền vào ví
                await refundOrderToWallet({
                    userId: order.userId,
                    userEmail: order.email,
                    orderId: order.id,
                    refundAmount: refundAmt,
                    reason: `Hoàn tiền hoàn hàng thành công cho đơn #${order.id}`
                });
                logger.info(`[Carrier Engine] Đã hoàn thành nạp ${refundAmt} VNĐ vào Ví User cho đơn ${orderId}`);
            } catch (wErr) {
                logger.error(`[Carrier Engine Wallet Error] ${wErr.message}`);
            }
        }

        return {
            done: nextReturnStatus === 'refunded',
            nextStep: { status: nextReturnStatus, title: returnTitle, location: 'Kho HAVEN Store', note: returnNote },
            status: nextReturnStatus,
            totalSteps: 4,
            completedSteps: 4
        };
    }

    const completedCount = (order.shippingTimeline || []).length;
    const steps = carrier.trackingSteps;

    if (completedCount >= steps.length) {
        return { done: true, message: 'Đã hoàn tất tất cả các bước giao hàng' };
    }

    const nextStep = steps[completedCount];
    if (!nextStep) return { done: true, message: 'Không còn bước tiếp theo' };

    // Fill template địa chỉ
    const filledTitle = fillTemplate(nextStep.title, order);
    const filledLocation = fillTemplate(nextStep.location, order);
    const filledNote = fillTemplate(nextStep.note, order);

    const timestamp = new Date();
    const timelineEvent = {
        status: nextStep.status,
        title: filledTitle,
        location: filledLocation,
        note: filledNote,
        timestamp,
        isCustomerVisible: true
    };

    // Timestamps theo status
    const statusTimestamps = {};
    if (nextStep.status === 'picked_up')         statusTimestamps.pickedUpAt = timestamp;
    if (nextStep.status === 'in_transit')         statusTimestamps.inTransitAt = statusTimestamps.inTransitAt || timestamp;
    if (nextStep.status === 'out_for_delivery')   statusTimestamps.outForDeliveryAt = timestamp;
    if (nextStep.status === 'delivered')          statusTimestamps.deliveredAt = timestamp;

    await OrderModel.findOneAndUpdate(
        { id: orderId },
        {
            status: nextStep.status,
            ...statusTimestamps,
            $push: { shippingTimeline: timelineEvent }
        }
    );

    // Lưu ShippingEvent
    await ShippingEventModel.create({
        orderId,
        status: nextStep.status,
        title: filledTitle,
        location: filledLocation,
        note: filledNote,
        timestamp,
        performedBy: adminName,
        carrierCode
    });

    const isLast = nextStep.status === 'delivered';
    logger.info(`[Carrier] Đơn ${orderId} → ${nextStep.status} (${filledTitle})`);

    return {
        done: isLast,
        nextStep: { ...nextStep, title: filledTitle, location: filledLocation, note: filledNote },
        status: nextStep.status,
        totalSteps: steps.length,
        completedSteps: completedCount + 1
    };
}

// ─── MAIN: Lấy tất cả tracking events của 1 đơn ─────────────────────────────
async function getOrderTimeline(orderId) {
    const order = await OrderModel.findOne({ id: orderId }).lean();
    if (!order) throw new Error(`Không tìm thấy đơn hàng ${orderId}`);

    const events = await ShippingEventModel.find({ orderId }).sort({ timestamp: 1 }).lean();

    return {
        order: {
            id: order.id,
            status: order.status,
            trackingNumber: order.trackingNumber,
            carrierCode: order.carrierCode,
            shippingProvider: order.shippingProvider,
            estimatedDelivery: order.estimatedDelivery,
            deliveredAt: order.deliveredAt
        },
        timeline: order.shippingTimeline || [],
        events,
        carrier: CARRIER_TEMPLATES[order.carrierCode] || null
    };
}

// ─── MAIN: Thêm custom shipping event (Admin nhập tay) ───────────────────────
async function addCustomEvent(orderId, { title, location, note, status }, adminName = 'Admin') {
    const timestamp = new Date();
    const timelineEvent = { status, title, location: location || '', note: note || '', timestamp, isCustomerVisible: true };

    await OrderModel.findOneAndUpdate({ id: orderId }, { $push: { shippingTimeline: timelineEvent } });
    await ShippingEventModel.create({ orderId, status, title, location, note, timestamp, performedBy: adminName });

    return timelineEvent;
}

module.exports = {
    CARRIER_TEMPLATES,
    initShipping,
    advanceShippingStep,
    getOrderTimeline,
    addCustomEvent,
    generateTrackingNumber
};
