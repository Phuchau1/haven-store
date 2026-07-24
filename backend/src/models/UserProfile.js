/**
 * ============================================================
 * MODEL: HỒ SƠ AI CƠ THỂ & PHONG CÁCH (UserProfile)
 * Quản lý thông tin AI phân tích của khách hàng:
 *   - Chỉ số cơ thể & vóc dáng (Body Metrics, BMI, Shape)
 *   - Cá nhân hóa màu sắc (SkinTone, Recommended/Avoid Colors)
 *   - Phân bố phong cách (Style Preferences %)
 *   - Đề xuất Size theo thương hiệu (Brand Sizes)
 *   - Lịch sử tương tác AI (Likes, Try-ons, Orders)
 * ============================================================
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserProfileSchema = new Schema({
    userId: { type: String, required: true, unique: true, index: true }, // Auth user ID hoặc guest token

    // ── AI Vision & Body Metrics
    bodyScan: {
        gender:         { type: String, enum: ['Men', 'Women', 'Unisex'], default: 'Men' },
        estimatedAge:   { type: Number, default: 24 },
        heightCm:       { type: Number, default: 172 },
        weightKg:       { type: Number, default: 65 },
        bmi:            { type: Number, default: 22.0 },
        bodyShape:      { type: String, enum: ['Rectangle', 'Triangle', 'Inverted Triangle', 'Oval', 'Athletic', 'Slim', 'Curvy'], default: 'Athletic' },
        shoulderWidthCm:{ type: Number, default: 44 },
        chestCm:        { type: Number, default: 94 },
        waistCm:        { type: Number, default: 78 },
        hipCm:          { type: Number, default: 95 },
        armLengthCm:    { type: Number, default: 60 },
        legLengthCm:    { type: Number, default: 102 }
    },

    // ── Personal Color & Features
    personalColor: {
        skinTone:          { type: String, enum: ['Warm', 'Cool', 'Neutral'], default: 'Warm' },
        skinSubtone:       { type: String, default: 'Light Amber' },
        hairColor:         { type: String, default: 'Dark Brown / Black' },
        eyeColor:          { type: String, default: 'Dark Brown' },
        faceShape:         { type: String, default: 'Oval' },
        recommendedColors: [{ type: String }],
        avoidColors:       [{ type: String }],
        highlightColor:    { type: String, default: '#F59E0B' }
    },

    // ── Style Vector & Percentages (%)
    stylePreferences: {
        Minimal:     { type: Number, default: 40 },
        Korean:      { type: Number, default: 35 },
        Streetwear:  { type: Number, default: 15 },
        SmartCasual: { type: Number, default: 10 },
        Luxury:      { type: Number, default: 0 },
        Business:    { type: Number, default: 0 },
        Sport:       { type: Number, default: 0 }
    },

    // ── Brand Dynamic Size Map
    brandSizes: {
        HavenStore:  { type: String, default: 'L' },
        Uniqlo:      { type: String, default: 'M' },
        Nike:        { type: String, default: 'L' },
        Zara:        { type: String, default: 'M' },
        Adidas:      { type: String, default: 'L' }
    },

    // ── History & Reinforcement Weights
    interactionHistory: {
        likedProductIds:   [{ type: String }],
        dislikedProductIds:[{ type: String }],
        tryOnProductIds:   [{ type: String }],
        viewedCategories:  [{ type: String }],
        budgetRange: {
            min: { type: Number, default: 100000 },
            max: { type: Number, default: 2000000 }
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
