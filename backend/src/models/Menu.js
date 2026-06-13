const mongoose = require('mongoose');
const { Schema } = mongoose;

const MenuSchema = new Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    link: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    children: { type: [Schema.Types.Mixed], default: [] }
}, { timestamps: true });

MenuSchema.index({ order: 1 });
MenuSchema.index({ isActive: 1 });

const MenuModel = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);

module.exports = { MenuModel };
