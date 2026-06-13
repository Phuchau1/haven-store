const mongoose = require('mongoose');

const SiteSettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g. "hero_banner"
    value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

const SiteSettingModel = mongoose.models.SiteSetting || mongoose.model('SiteSetting', SiteSettingSchema);

module.exports = { SiteSettingModel };
