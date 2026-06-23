const { Queue, Worker } = require('bullmq');
const { sendOrderConfirmationEmail } = require('./emailService');
const logger = require('../utils/logger');

// Cấu hình Redis connection cho BullMQ
// Lưu ý: BullMQ tự động retry kết nối nếu Redis chết.
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
};

// Khởi tạo Queue
const emailQueue = new Queue('email-queue', { connection });

// Khởi tạo Worker để xử lý công việc từ Queue
const emailWorker = new Worker('email-queue', async job => {
    if (job.name === 'send-order-confirmation') {
        const orderData = job.data;
        logger.info(`[Email Worker] Đang xử lý gửi email xác nhận đơn hàng ${orderData.id}`);
        try {
            await sendOrderConfirmationEmail(orderData);
            logger.info(`[Email Worker] Gửi email thành công cho đơn hàng ${orderData.id}`);
        } catch (error) {
            logger.error(`[Email Worker] Lỗi gửi email cho đơn hàng ${orderData.id}: ${error.message}`);
            throw error; // Ném lỗi để BullMQ tự động retry
        }
    }
}, { connection });

emailWorker.on('failed', (job, err) => {
    logger.error(`[Email Worker] Job ${job.id} thất bại sau các lần thử: ${err.message}`);
});

/**
 * Thêm công việc gửi email vào hàng đợi
 */
const enqueueOrderEmail = async (orderData) => {
    try {
        await emailQueue.add('send-order-confirmation', orderData, {
            attempts: 3, // Thử lại tối đa 3 lần nếu lỗi (do đứt mạng SMTP...)
            backoff: {
                type: 'exponential',
                delay: 2000 // Chờ 2s rồi x2 lên cho các lần thử sau
            }
        });
        logger.info(`[Email Queue] Đã thêm đơn hàng ${orderData.id} vào hàng đợi email.`);
    } catch (error) {
        // Fallback: nếu Redis/BullMQ chết, cố gắng gửi email đồng bộ ngay lập tức để không rớt luồng
        logger.warn(`[Email Queue] Không thể kết nối Queue. Fallback gửi email đồng bộ: ${error.message}`);
        sendOrderConfirmationEmail(orderData).catch(e => logger.error(`[Email Fallback Error] ${e.message}`));
    }
};

module.exports = { enqueueOrderEmail, emailQueue, emailWorker };
