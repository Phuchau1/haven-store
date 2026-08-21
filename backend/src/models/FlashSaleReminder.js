const mongoose = require('mongoose');
const { Schema } = mongoose;

const FlashSaleReminderSchema = new Schema({
    productId:     { type: String, required: true, index: true },
    productName:   { type: String, default: '' },
    userId:        { type: String, default: null, index: true },
    email:         { type: String, default: null },
    isNotified:    { type: Boolean, default: false },
    notifiedAt:    { type: Date, default: null },
    createdAt:     { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.models.FlashSaleReminder || mongoose.model('FlashSaleReminder', FlashSaleReminderSchema);
