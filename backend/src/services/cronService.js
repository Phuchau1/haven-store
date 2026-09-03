const cron = require('node-cron');
const { OrderModel } = require('../models/Order');
const { restoreStockOnCancel } = require('../controllers/orderController');
const logger = require('../utils/logger');

const startCronJobs = () => {
    // Chạy mỗi 1 phút
    cron.schedule('* * * * *', async () => {
        try {
            const expirationTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
            
            // Tìm các đơn hàng pending đã quá 15 phút
            const expiredOrders = await OrderModel.find({
                status: 'pending',
                createdAt: { $lt: expirationTime }
            });

            if (expiredOrders.length > 0) {
                logger.info(`[CronJob] Tìm thấy ${expiredOrders.length} đơn hàng hết hạn chờ thanh toán. Bắt đầu hủy và hoàn tồn kho...`);

                for (const order of expiredOrders) {
                    order.status = 'cancelled';
                    order.note = order.note ? `${order.note} - Đã hủy tự động do quá thời gian thanh toán.` : 'Đã hủy tự động do quá thời gian thanh toán.';
                    await order.save();

                    // Hoàn trả tồn kho vật lý và biến thể
                    if (order.items && order.items.length > 0) {
                        await restoreStockOnCancel(order.items, order.id);
                    }
                    logger.info(`[CronJob] Đã hủy đơn hàng ${order.id} và hoàn trả đầy đủ tồn kho.`);
                }
            }
        } catch (error) {
            logger.error(`[CronJob Error] Lỗi khi xử lý đơn hàng quá hạn: ${error.message}`);
        }
    });

    logger.info('[CronJob] Order expiration cron service started.');
};

module.exports = { startCronJobs };
