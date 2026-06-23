const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditLogSchema = new Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String }, // Có thể null nếu hệ thống tự chạy
    action: { type: String, required: true }, // vd: 'update_product', 'delete_category'
    entity_type: { type: String, required: true }, // vd: 'Product', 'Category'
    entity_id: { type: String }, 
    old_values: { type: Schema.Types.Mixed }, // Dữ liệu trước thay đổi
    new_values: { type: Schema.Types.Mixed }, // Dữ liệu sau thay đổi
    ip_address: { type: String },
    created_at: { type: String, required: true, default: () => new Date().toISOString() }
}, { timestamps: true });

// Tối ưu query lịch sử
AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
AuditLogSchema.index({ user_id: 1 });

const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

module.exports = { AuditLogModel };
