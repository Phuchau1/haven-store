const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatMessageSchema = new Schema({
    id: { type: String, required: true, unique: true },
    session_id: { type: String, required: true },
    sender_type: { type: String, required: true, enum: ['user', 'admin', 'bot'] },
    message: { type: String, required: true }
}, { timestamps: true });

const ChatMessageModel = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);

module.exports = { ChatMessageModel };
