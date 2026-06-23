const { createClient } = require('redis');
const logger = require('./logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            // Reconnect logic: wait 1s, then 2s, cap at 5s. Stop after 10 retries if needed.
            if (retries > 10) {
                logger.warn('[Redis] Max retries reached. Cache will be disabled.');
                return new Error('Max retries reached');
            }
            return Math.min(retries * 1000, 5000);
        }
    }
});

let isRedisConnected = false;

redisClient.on('error', (err) => {
    isRedisConnected = false;
    logger.warn(`[Redis Error] ${err.message}. Cache operations will be bypassed.`);
});

redisClient.on('connect', () => {
    logger.info('[Redis] Connected successfully.');
    isRedisConnected = true;
});

redisClient.connect().catch(err => {
    logger.warn(`[Redis Connect Error] ${err.message}`);
});

/**
 * Lấy dữ liệu từ cache an toàn (Graceful degradation)
 * Nếu Redis chết, sẽ trả về null để app tự query từ DB
 */
const getCache = async (key) => {
    if (!isRedisConnected) return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        logger.warn(`[Redis Get Error] ${err.message}`);
        return null;
    }
};

/**
 * Set cache an toàn
 */
const setCache = async (key, value, ttlSeconds = 3600) => {
    if (!isRedisConnected) return;
    try {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
        logger.warn(`[Redis Set Error] ${err.message}`);
    }
};

/**
 * Xóa cache an toàn (Hỗ trợ xóa theo pattern nếu truyền isPattern=true)
 */
const delCache = async (keyPattern, isPattern = false) => {
    if (!isRedisConnected) return;
    try {
        if (isPattern) {
            const keys = await redisClient.keys(keyPattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } else {
            await redisClient.del(keyPattern);
        }
    } catch (err) {
        logger.warn(`[Redis Del Error] ${err.message}`);
    }
};

module.exports = {
    redisClient,
    getCache,
    setCache,
    delCache,
    getIsConnected: () => isRedisConnected
};
