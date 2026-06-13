const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─── Subcategory Schema ────────────────────────────────────────────────────────
const SubCategorySchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String },
    description: { type: String },
    image: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ─── Category Schema ───────────────────────────────────────────────────────────
const CategorySchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String, required: true },
    video: { type: String }, // Optional background video loop
    count: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    subcategories: { type: [SubCategorySchema], default: [] },
}, { timestamps: true });

// Index for faster queries
CategorySchema.index({ order: 1 });
CategorySchema.index({ isActive: 1 });

const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);

module.exports = { CategoryModel };
