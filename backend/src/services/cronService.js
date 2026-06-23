const cron = require('node-cron');
const { OrderModel } = require('../models/Order');
const { ProductVariantModel } = require('../models/ProductVariant');
const { ProductModel } = require('../models/Product');
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

                    // Hoàn lại reserved_stock
                    for (const item of order.items) {
                        const productId = item.product.id;
                        const size = item.selectedSize;
                        const color = item.selectedColor.name;
                        const quantity = item.quantity;

                        // Tìm pVariant để trả lại reserved_stock
                        await ProductVariantModel.findOneAndUpdate(
                            { product_id: productId, size_id: size, color_id: color },
                            { $inc: { reserved_stock: -quantity } }
                        );
                        
                        // Note: stock của Product gốc (embedded) không đổi vì lúc đặt hàng mới chỉ tính vào reserved_stock 
                        // Nếu logic cũ trừ đi stock của embedded variant, ta đã sửa thành không trừ, nên ở đây không cần hoàn.
                    }
                    logger.info(`[CronJob] Đã hủy đơn hàng ${order.id} và hoàn lại giữ chỗ tồn kho.`);
                }
            }
        } catch (error) {
            logger.error(`[CronJob Error] Lỗi khi xử lý đơn hàng quá hạn: ${error.message}`);
        }
    });

    logger.info('[CronJob] Order expiration cron service started.');
};

module.exports = { startCronJobs };
