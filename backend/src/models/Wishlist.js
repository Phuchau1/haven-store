const mongoose = require('mongoose');
const { Schema } = mongoose;

const WishlistSchema = new Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    product_id: { type: String, required: true },
    created_at: { type: String, required: true, default: () => new Date().toISOString() }
}, { timestamps: true });

const WishlistModel = mongoose.models.Wishlist || mongoose.model('Wishlist', WishlistSchema);

module.exports = { WishlistModel };
