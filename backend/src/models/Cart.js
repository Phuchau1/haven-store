const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartItemSchema = new Schema({
    product: { type: Schema.Types.Mixed, required: true },
    quantity: { type: Number, required: true, default: 1 },
    selectedSize: { type: String },
    selectedColor: { type: Schema.Types.Mixed }
}, { _id: false });

const CartSchema = new Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, index: true },
    items: [CartItemSchema],
    created_at: { type: Date, default: Date.now }
}, { timestamps: true });

const CartModel = mongoose.models.Cart || mongoose.model('Cart', CartSchema);

module.exports = { CartModel };
