const cron = require('node-cron');
const { OrderModel } = require('../models/Order');
const { restoreStockOnCancel } = require('../controllers/orderController');
const logger = require('../utils/logger');

const startCronJobs = () => {
    // ─── 1. Chạy mỗi 5 phút: Quét các đơn hàng pending quá hạn & đơn giao quá 3 ngày ───
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();

            // A. Hủy đơn hàng pending online quá 15 phút (vnpay, momo, wallet chưa thanh toán)
            const onlineExpiredTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
            const expiredOnlineOrders = await OrderModel.find({
                status: 'pending',
                paymentMethod: { $in: ['vnpay', 'momo', 'wallet'] },
                paymentStatus: { $ne: 'paid' },
                createdAt: { $lt: onlineExpiredTime }
            });

            for (const order of expiredOnlineOrders) {
                order.status = 'cancelled';
                order.note = order.note ? `${order.note} - Tự động hủy do quá thời gian thanh toán (15 phút).` : 'Tự động hủy do quá thời gian thanh toán (15 phút).';
                await order.save();
                if (order.items && order.items.length > 0) {
                    await restoreStockOnCancel(order.items, order.id);
                }
                logger.info(`[CronJob] Đã tự động hủy đơn online ${order.id} quá hạn thanh toán.`);
            }

            // B. Hủy đơn COD pending quá 24h nếu chưa được Shop xác nhận
            const codExpiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const expiredCodOrders = await OrderModel.find({
                status: 'pending',
                paymentMethod: { $in: ['cod', 'pay-cod', 'bank-transfer'] },
                createdAt: { $lt: codExpiredTime }
            });

            for (const order of expiredCodOrders) {
                order.status = 'cancelled';
                order.note = order.note ? `${order.note} - Tự động hủy do Shop chưa xác nhận sau 24 giờ.` : 'Tự động hủy do Shop chưa xác nhận sau 24 giờ.';
                await order.save();
                if (order.items && order.items.length > 0) {
                    await restoreStockOnCancel(order.items, order.id);
                }
                logger.info(`[CronJob] Đã tự động hủy đơn COD ${order.id} sau 24 giờ chưa xác nhận.`);
            }

            // C. Tự động chuyển đơn 'delivered' sang 'completed' sau 3 ngày kể từ khi giao thành công
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            const deliveredOrdersToComplete = await OrderModel.find({
                status: 'delivered',
                'returnRequest.status': { $in: ['none', null] },
                $or: [
                    { deliveredAt: { $lt: threeDaysAgo } },
                    { updatedAt: { $lt: threeDaysAgo } }
                ]
            });

            for (const order of deliveredOrdersToComplete) {
                order.status = 'completed';
                order.shippingTimeline = order.shippingTimeline || [];
                order.shippingTimeline.push({
                    status: 'completed',
                    title: 'Đơn hàng hoàn tất thành công',
                    note: 'Hệ thống tự động xác nhận hoàn tất sau 3 ngày kể từ khi giao hàng thành công.',
                    timestamp: now,
                    isCustomerVisible: true
                });
                await order.save();
                logger.info(`[CronJob] Đã tự động hoàn tất đơn hàng ${order.id} sau 3 ngày.`);
            }

            // D. Tự động đóng yêu cầu hoàn hàng nếu quá 5 ngày kể từ ngày duyệt mà khách không gửi hàng
            const expiredReturnOrders = await OrderModel.find({
                status: 'returning',
                'returnRequest.status': 'approved',
                'returnRequest.returnTrackingNumber': { $in: ['', null] },
                'returnRequest.shippingDeadline': { $lt: now }
            });

            for (const order of expiredReturnOrders) {
                order.status = 'delivered';
                order.returnRequest.status = 'rejected';
                order.returnRequest.rejectReason = 'Hệ thống tự động đóng yêu cầu do khách hàng không gửi hàng trong thời hạn 5 ngày quy định.';
                order.shippingTimeline.push({
                    status: 'delivered',
                    title: 'Đóng yêu cầu hoàn hàng',
                    note: 'Hết hạn gửi hàng trả về shop (quá 5 ngày kể từ khi được duyệt).',
                    timestamp: now,
                    isCustomerVisible: true
                });
                await order.save();
                logger.info(`[CronJob] Đã tự động đóng yêu cầu hoàn hàng của đơn ${order.id} do quá hạn 5 ngày gửi hàng.`);
            }

        } catch (error) {
            logger.error(`[CronJob Error] ${error.message}`);
        }
    });

    logger.info('[CronJob] E-Commerce SLA Automation Engine started successfully.');
};

module.exports = { startCronJobs };
