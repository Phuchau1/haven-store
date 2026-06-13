const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartItemSchema = new Schema({
    variant_id: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true }
}, { _id: false });

const CartSchema = new Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    items: [CartItemSchema],
    created_at: { type: String, required: true, default: () => new Date().toISOString() }
}, { timestamps: true });

const CartModel = mongoose.models.Cart || mongoose.model('Cart', CartSchema);

module.exports = { CartModel };
