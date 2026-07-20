const { Queue, Worker } = require('bullmq');
const { sendOrderConfirmationEmail } = require('./emailService');
const logger = require('../utils/logger');

const REDIS_HOST = process.env.REDIS_HOST || process.env.REDIS_URL;

let emailQueue = null;
let emailWorker = null;

if (REDIS_HOST) {
    const connection = {
        host: process.env.REDIS_HOST || 'localhost', // If URL is provided, bullmq recommends ioredis instance, but object works for host/port. We will assume REDIS_HOST is used.
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: null
    };

    try {
        emailQueue = new Queue('email-queue', { connection });

        emailWorker = new Worker('email-queue', async job => {
            if (job.name === 'send-order-confirmation') {
                const orderData = job.data;
                logger.info(`[Email Worker] Đang xử lý gửi email cho đơn hàng ${orderData.id}`);
                await sendOrderConfirmationEmail(orderData);
                logger.info(`[Email Worker] Gửi email thành công cho đơn hàng ${orderData.id}`);
            }
        }, { connection });

        emailWorker.on('failed', (job, err) => {
            logger.error(`[Email Worker] Job ${job?.id} thất bại: ${err.message}`);
        });

        emailQueue.on('error', (err) => logger.warn(`[BullMQ Queue] Lỗi kết nối: ${err.message}`));
        emailWorker.on('error', (err) => logger.warn(`[BullMQ Worker] Lỗi kết nối: ${err.message}`));
        
        logger.info('[BullMQ] Queue & Worker initialized.');
    } catch (e) {
        logger.warn(`[BullMQ] Lỗi khởi tạo: ${e.message}`);
    }
} else {
    logger.info('[BullMQ] REDIS_HOST is not set. Email tasks will be executed synchronously.');
}

const enqueueOrderEmail = async (orderData) => {
    if (emailQueue) {
        try {
            await emailQueue.add('send-order-confirmation', orderData, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 }
            });
            logger.info(`[Email Queue] Đã thêm đơn hàng ${orderData.id} vào hàng đợi Redis.`);
            return;
        } catch (error) {
            logger.warn(`[Email Queue] Queue error, fallback sang gửi trực tiếp: ${error.message}`);
        }
    } else {
        logger.info(`[Email] Không có Redis Queue → Gửi email trực tiếp cho đơn hàng ${orderData.id}`);
    }
    
    // Gửi email trực tiếp (không có Redis hoặc Redis lỗi)
    try {
        await sendOrderConfirmationEmail(orderData);
        logger.info(`[Email] Gửi email trực tiếp thành công cho đơn hàng ${orderData.id}`);
    } catch (e) {
        logger.error(`[Email] LỖI gửi email trực tiếp cho đơn hàng ${orderData.id}: ${e.message}`);
    }
};

module.exports = { enqueueOrderEmail };
