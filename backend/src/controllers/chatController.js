/**
 * ============================================================
 * CONTROLLER: HỖ TRỢ TRỰC TUYẾN (Chat)
 * Mô tả: Xử lý lưu trữ phiên chat (Session) và tin nhắn (Message)
 *        vào Database. Dùng kết hợp với Socket.IO để chat realtime.
 * ============================================================
 */
const { ChatSessionModel } = require('../models/ChatSession');
const { ChatMessageModel } = require('../models/ChatMessage');
const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [ChatController] ${msg}\n`);
    console.log(`[ChatController] ${msg}`);
}

/**
 * @desc Tạo một phiên chat mới hoặc lấy lại phiên chat cũ đang mở
 * @route POST /api/chat/session
 */
const createOrGetSession = async (req, res, next) => {
    try {
        const { customer_name, phone, session_id } = req.body;

        // Nếu client có truyền session_id, tìm xem có tồn tại không
        if (session_id) {
            const session = await ChatSessionModel.findOne({ id: session_id });
            if (session) {
                return res.json({ success: true, session });
            }
        }

        if (!customer_name || !phone) {
            return res.status(400).json({ success: false, message: 'Thiếu tên khách hàng hoặc số điện thoại' });
        }

        // Tìm xem có session nào đang mở với số điện thoại này không để tiếp tục chat
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

/**
 * @desc Lấy danh sách tất cả các phiên chat (Dành cho Admin)
 * @route GET /api/chat/sessions
 */
const getSessions = async (req, res, next) => {
    try {
        const sessions = await ChatSessionModel.find().sort({ updatedAt: -1 }); // Mới nhất lên đầu
        res.json({ success: true, sessions });
    } catch (error) {
        log(`Error in getSessions: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Lấy lịch sử tin nhắn của một phiên chat cụ thể
 * @route GET /api/chat/sessions/:sessionId/messages
 */
const getMessagesBySession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const messages = await ChatMessageModel.find({ session_id: sessionId }).sort({ createdAt: 1 }); // Xếp theo thời gian tăng dần
        res.json({ success: true, messages });
    } catch (error) {
        log(`Error in getMessagesBySession: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Lưu một tin nhắn mới vào Database (Cả khách hàng và Admin gửi đều gọi API này/hoặc lưu qua socket)
 * @route POST /api/chat/messages
 */
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

        // Cập nhật lại mốc thời gian (updatedAt) của session để session này trồi lên đầu trong danh sách của Admin
        await ChatSessionModel.findOneAndUpdate({ id: session_id }, { updatedAt: new Date() });

        log(`Persisted message ${msgId} in session ${session_id}`);
        res.json({ success: true, message: newMessage });
    } catch (error) {
        log(`Error in sendMessage: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Đóng một phiên chat (Kết thúc hỗ trợ)
 * @route PUT /api/chat/sessions/:sessionId/close
 */
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
