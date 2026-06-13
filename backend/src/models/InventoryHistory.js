const mongoose = require('mongoose');
const { Schema } = mongoose;

const InventoryHistorySchema = new Schema({
    id: { type: String, required: true, unique: true },
    variant_id: { type: String, required: true },
    type: { type: String, required: true, enum: ['import', 'export'] },
    quantity: { type: Number, required: true },
    note: { type: String },
    created_at: { type: String, required: true, default: () => new Date().toISOString() }
}, { timestamps: true });

const InventoryHistoryModel = mongoose.models.InventoryHistory || mongoose.model('InventoryHistory', InventoryHistorySchema);

module.exports = { InventoryHistoryModel };
