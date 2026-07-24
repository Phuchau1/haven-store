/**
 * ============================================================
 * MIDDLEWARE: IN-MEMORY CACHE (Không cần Redis)
 * Mục đích: Cache các response phổ biến (products, categories, banners)
 *           để giảm tải MongoDB khi 1000+ user truy cập cùng lúc.
 *
 * Chiến lược: TTL-based cache với LRU eviction đơn giản.
 * - GET /api/products        → cache 30 giây
 * - GET /api/categories      → cache 60 giây
 * - GET /api/banners         → cache 60 giây
 * - GET /api/flash-sales     → cache 30 giây
 * ============================================================
 */

const logger = require('../utils/logger');

// ─── Simple TTL Cache Store ──────────────────────────────────
class TTLCache {
    constructor() {
        this.store = new Map();
        this.maxSize = 500; // Tối đa 500 entries
        setInterval(() => this.cleanup(), 30000); // Dọn dẹp mỗi 30s
    }

    set(key, value, ttlMs) {
        // Evict nếu quá size
        if (this.store.size >= this.maxSize) {
            const firstKey = this.store.keys().next().value;
            this.store.delete(firstKey);
        }
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
            createdAt: Date.now()
        });
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }

    invalidate(pattern) {
        for (const key of this.store.keys()) {
            if (key.includes(pattern)) this.store.delete(key);
        }
    }

    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) this.store.delete(key);
        }
    }

    get size() { return this.store.size; }
}

const cache = new TTLCache();

// ─── TTL Config theo loại endpoint ───────────────────────────
const CACHE_TTL = {
    '/api/products':     30 * 1000,  // 30 giây
    '/api/categories':   60 * 1000,  // 60 giây
    '/api/banners':      60 * 1000,  // 60 giây
    '/api/flash-sales':  20 * 1000,  // 20 giây (Flash sale hay thay đổi)
    '/api/menus':        5  * 60 * 1000, // 5 phút
    '/api/sizes':        5  * 60 * 1000, // 5 phút
    '/api/colors':       5  * 60 * 1000, // 5 phút
    '/api/locations':    10 * 60 * 1000, // 10 phút
};

function getCacheTTL(path) {
    for (const [prefix, ttl] of Object.entries(CACHE_TTL)) {
        if (path.startsWith(prefix)) return ttl;
    }
    return null; // Không cache
}

// ─── Cache Middleware ─────────────────────────────────────────
function cacheMiddleware(req, res, next) {
    // Chỉ cache GET requests
    if (req.method !== 'GET') return next();

    const ttl = getCacheTTL(req.path);
    if (!ttl) return next();

    const cacheKey = `${req.path}?${new URLSearchParams(req.query).toString()}`;
    const cached = cache.get(cacheKey);

    if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', ttl);
        return res.json(cached);
    }

    // Intercept res.json để cache kết quả
    const originalJson = res.json.bind(res);
    res.json = (data) => {
        if (res.statusCode === 200 && data?.success !== false) {
            cache.set(cacheKey, data, ttl);
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(data);
    };

    next();
}

// ─── Cache Invalidation Helper ────────────────────────────────
function invalidateCache(pattern) {
    cache.invalidate(pattern);
    logger.info(`[Cache] Invalidated: ${pattern}`);
}

// ─── Cache Stats (admin endpoint) ────────────────────────────
function getCacheStats() {
    return {
        size: cache.size,
        maxSize: cache.maxSize,
    };
}

module.exports = { cacheMiddleware, invalidateCache, getCacheStats };
