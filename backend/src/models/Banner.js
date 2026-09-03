const mongoose = require('mongoose');
const { Schema } = mongoose;

const BannerSchema = new Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    image: { type: String, required: true },
    video: { type: String, default: '' },
    link: { type: String, required: true, default: '/products' },
    link_text: { type: String, default: 'Xem chi tiết' },
    type: { type: String, required: true, default: 'hero', enum: ['hero', 'middle', 'collection'] },
    status: { type: String, required: true, default: 'active' },
    order: { type: Number, default: 0 },
    created_at: { type: String, required: true, default: () => new Date().toISOString() }
}, { timestamps: true });

const BannerModel = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);

module.exports = { BannerModel };
