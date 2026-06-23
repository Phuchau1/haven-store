const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderItemProductSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    category: { type: String },
    categoryLabel: { type: String },
    images: [{ type: String }],
    sizes: [{ type: String }],
    colors: [{
        name: { type: String },
        hex: { type: String }
    }],
    description: { type: String },
    badge: { type: String },
    rating: { type: Number },
    reviews: { type: Number },
    inStock: { type: Boolean }
}, { _id: false });

const OrderItemSchema = new Schema({
    product: { type: OrderItemProductSchema, required: true },
    quantity: { type: Number, required: true, default: 1 },
    selectedSize: { type: String, required: true },
    selectedColor: {
        name: { type: String, required: true },
        hex: { type: String, required: true }
    }
}, { _id: false });

const OrderSchema = new Schema({
    id: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    couponCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 }, // fallback handled in controller
    note: { type: String },
    transferReceipt: { type: String, default: '' },
    status: { type: String, required: true, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refund_requested', 'refunded'], default: 'pending' },
    createdAt: { type: String, required: true }
}, { timestamps: true });

const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);

module.exports = { OrderModel };
