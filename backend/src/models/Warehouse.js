const mongoose = require('mongoose');
const { Schema } = mongoose;

const WarehouseSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // e.g., WH-HN, WH-HCM
    address: { type: String, required: true },
    manager_id: { type: String }, // Liên kết với User (manager)
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

const WarehouseModel = mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);

module.exports = { WarehouseModel };
