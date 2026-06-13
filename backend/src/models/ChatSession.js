const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatSessionSchema = new Schema({
    id: { type: String, required: true, unique: true },
    customer_name: { type: String, required: true },
    phone: { type: String, required: true },
    status: { type: String, required: true, enum: ['open', 'closed'], default: 'open' }
}, { timestamps: true });

const ChatSessionModel = mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema);

module.exports = { ChatSessionModel };
