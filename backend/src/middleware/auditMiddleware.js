const { AuditLogModel } = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Middleware để ghi log hành động của Admin.
 * Lưu ý: Middleware này cần được đặt sau middleware xác thực (authMiddleware) 
 * để có thể lấy được req.user
 */
const auditMiddleware = (entityType, actionPrefix) => {
    return async (req, res, next) => {
        // Chỉ ghi log cho các request làm thay đổi dữ liệu (POST, PUT, PATCH, DELETE)
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            // Backup hàm res.send để lấy dữ liệu sau khi request hoàn thành
            const originalSend = res.send;

            res.send = function (data) {
                res.send = originalSend; // Khôi phục hàm gốc
                
                // Bất đồng bộ ghi log, không làm chậm response
                (async () => {
                    try {
                        let statusCode = res.statusCode;
                        if (statusCode >= 200 && statusCode < 300) {
                            const userId = req.user ? (req.user.id || req.user._id) : 'system_or_guest';
                            const action = `${actionPrefix}_${req.method.toLowerCase()}`;
                            const entityId = req.params.id || req.body.id || 'N/A';
                            
                            // Lấy IP, tính cả trường hợp chạy qua Reverse Proxy (Nginx)
                            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

                            const auditLog = new AuditLogModel({
                                id: `audit-${Math.random().toString(36).substr(2, 9)}`,
                                user_id: userId.toString(),
                                action: action,
                                entity_type: entityType,
                                entity_id: entityId,
                                old_values: null, // Cần logic phức tạp hơn nếu muốn lấy old_values trước khi save, ở mức middleware ta chỉ lưu body request
                                new_values: req.body,
                                ip_address: ipAddress
                            });

                            await auditLog.save();
                        }
                    } catch (error) {
                        logger.error(`[AuditMiddleware] Lỗi ghi log: ${error.message}`);
                    }
                })();

                return originalSend.apply(this, arguments);
            };
        }
        
        next();
    };
};

module.exports = auditMiddleware;
