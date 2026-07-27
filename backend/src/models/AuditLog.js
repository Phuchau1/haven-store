const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditLogSchema = new Schema({
    id: { type: String, required: true, default: () => 'LOG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7) },
    user_id: { type: String, default: null }, // Có thể null nếu hệ thống tự chạy
    action: { type: String, required: true, default: 'SYSTEM_ACTION' }, // vd: 'update_product', 'delete_category'
    entity_type: { type: String, required: true, default: 'General' }, // vd: 'Product', 'Category', 'Order'
    entity_id: { type: String, default: null }, 
    old_values: { type: Schema.Types.Mixed, default: null }, // Dữ liệu trước thay đổi
    new_values: { type: Schema.Types.Mixed, default: null }, // Dữ liệu sau thay đổi
    ip_address: { type: String, default: '127.0.0.1' },
    notes: { type: String, default: '' },
    created_at: { type: String, required: true, default: () => new Date().toISOString() }
}, { timestamps: true });

// Tối ưu query lịch sử
AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
AuditLogSchema.index({ user_id: 1 });

const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

module.exports = { AuditLogModel };
