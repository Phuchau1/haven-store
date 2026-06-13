const { ChatSessionModel } = require('../models/ChatSession');
const { ChatMessageModel } = require('../models/ChatMessage');
const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [ChatController] ${msg}\n`);
    console.log(`[ChatController] ${msg}`);
}

const createOrGetSession = async (req, res, next) => {
    try {
        const { customer_name, phone, session_id } = req.body;

        if (session_id) {
            const session = await ChatSessionModel.findOne({ id: session_id });
            if (session) {
                return res.json({ success: true, session });
            }
        }

        if (!customer_name || !phone) {
            return res.status(400).json({ success: false, message: 'Thiếu tên khách hàng hoặc số điện thoại' });
        }

        // Tìm xem có session nào đang mở với sđt này không
        let session = await ChatSessionModel.findOne({ phone, status: 'open' });
        if (!session) {
            const newId = `session-${Math.random().toString(36).substr(2, 9)}`;
            session = new ChatSessionModel({
                id: newId,
                customer_name,
                phone,
                status: 'open'
            });
            await session.save();
            log(`Created new chat session: ${newId} for ${customer_name}`);
        } else {
            log(`Retrieved existing active chat session: ${session.id}`);
        }

        res.json({ success: true, session });
    } catch (error) {
        log(`Error in createOrGetSession: ${error.message}`);
        next(error);
    }
};

const getSessions = async (req, res, next) => {
    try {
        const sessions = await ChatSessionModel.find().sort({ updatedAt: -1 });
        res.json({ success: true, sessions });
    } catch (error) {
        log(`Error in getSessions: ${error.message}`);
        next(error);
    }
};

const getMessagesBySession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const messages = await ChatMessageModel.find({ session_id: sessionId }).sort({ createdAt: 1 });
        res.json({ success: true, messages });
    } catch (error) {
        log(`Error in getMessagesBySession: ${error.message}`);
        next(error);
    }
};

const sendMessage = async (req, res, next) => {
    try {
        const { session_id, sender_type, message } = req.body;

        if (!session_id || !sender_type || !message) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin tin nhắn bắt buộc' });
        }

        const msgId = `msg-${Math.random().toString(36).substr(2, 9)}`;
        const newMessage = new ChatMessageModel({
            id: msgId,
            session_id,
            sender_type,
            message
        });
        await newMessage.save();

        // Cập nhật mốc thời gian cập nhật của session để đẩy lên đầu
        await ChatSessionModel.findOneAndUpdate({ id: session_id }, { updatedAt: new Date() });

        log(`Persisted message ${msgId} in session ${session_id}`);
        res.json({ success: true, message: newMessage });
    } catch (error) {
        log(`Error in sendMessage: ${error.message}`);
        next(error);
    }
};

const closeSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const session = await ChatSessionModel.findOneAndUpdate(
            { id: sessionId },
            { status: 'closed' },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiên chat' });
        }

        log(`Closed session: ${sessionId}`);
        res.json({ success: true, session });
    } catch (error) {
        log(`Error in closeSession: ${error.message}`);
        next(error);
    }
};

module.exports = {
    createOrGetSession,
    getSessions,
    getMessagesBySession,
    sendMessage,
    closeSession
};
