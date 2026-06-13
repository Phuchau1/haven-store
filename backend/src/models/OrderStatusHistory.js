const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderStatusHistorySchema = new Schema({
    id: { type: String, required: true, unique: true },
    order_id: { type: String, required: true },
    status: { type: String, required: true },
    note: { type: String },
    created_at: { type: String, required: true, default: () => new Date().toISOString() }
}, { timestamps: true });

const OrderStatusHistoryModel = mongoose.models.OrderStatusHistory || mongoose.model('OrderStatusHistory', OrderStatusHistorySchema);

module.exports = { OrderStatusHistoryModel };
