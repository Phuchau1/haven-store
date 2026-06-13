const mongoose = require('mongoose');
const { Schema } = mongoose;

const BannerSchema = new Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    image: { type: String, required: true },
    video: { type: String, default: '' },
    link: { type: String, required: true },
    status: { type: String, required: true, default: 'active' },
    created_at: { type: String, required: true, default: () => new Date().toISOString() }
}, { timestamps: true });

const BannerModel = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);

module.exports = { BannerModel };
