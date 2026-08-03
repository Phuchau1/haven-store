/**
 * ============================================================
 * CẤU HÌNH: KẾT NỐI CƠ SỞ DỮ LIỆU MONGODB
 * Mô tả: Quản lý kết nối Mongoose đến MongoDB với cơ chế
 *        tự động thử lại (retry) và ghi log trạng thái.
 * ============================================================
 */
const mongoose = require('mongoose');

// Biến theo dõi trạng thái kết nối hiện tại
let dbConnected = false;

/**
 * Hàm ghi log có timestamp cho các sự kiện MongoDB
 * @param {string} msg - Nội dung log
 */
function dbLog(msg) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [MongoDB] ${msg}`);
}

// Tắt cảnh báo strictQuery của Mongoose
mongoose.set('strictQuery', false);

/* ---------- Lắng nghe sự kiện kết nối MongoDB ---------- */

// Kết nối thành công
mongoose.connection.on('connected', () => {
    dbConnected = true;
    dbLog('Kết nối MongoDB thành công!');
});

// Kết nối bị lỗi
mongoose.connection.on('error', (err) => {
    dbConnected = false;
    dbLog(`Lỗi kết nối MongoDB: ${err.message}`);
});

// Kết nối bị ngắt — Mongoose sẽ tự động thử kết nối lại
mongoose.connection.on('disconnected', () => {
    dbConnected = false;
    dbLog('MongoDB mất kết nối! Mongoose sẽ tự động thử kết nối lại...');
});

/* ---------- Cấu hình số lần thử lại ---------- */
const MAX_RETRIES  = 10;   // Số lần thử kết nối tối đa
const RETRY_DELAY  = 5000; // Thời gian chờ giữa các lần thử (mili giây)

/**
 * Hàm kết nối đến MongoDB với cơ chế retry tự động
 * @param {number} retries - Số lần thử còn lại (đệ quy)
 */
async function connectDB(retries = MAX_RETRIES) {
    // Đọc URI từ biến môi trường, fallback về MongoDB Atlas Cloud chính thức nếu không có
    const uri = process.env.MONGODB_URI || 'mongodb+srv://ntphau21_db_user:l4AQJN8xt0oPC8GD@cluster0.kyrsbnq.mongodb.net/fashion_store';

    // Ẩn thông tin đăng nhập trong log để bảo mật
    const safeUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    dbLog(`Đang kết nối đến MongoDB tại: ${safeUri}...`);

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 8000,   // Timeout khi chọn MongoDB server
            socketTimeoutMS:          60000,  // Đóng socket sau 60 giây không hoạt động
            maxPoolSize:              100,     // Tăng từ 50 → 100 connections song song
            minPoolSize:              5,       // Giữ sẵn 5 connection ấm (giảm latency)
            connectTimeoutMS:         15000,  // Timeout kết nối lần đầu
            maxIdleTimeMS:            60000,  // Đóng connection nhàn rỗi sau 60 giây
            heartbeatFrequencyMS:     10000,  // Ping MongoDB mỗi 10 giây để giữ connection
        });
        // Lưu ý: không cần set dbConnected = true ở đây
        // vì sự kiện 'connected' ở trên sẽ tự xử lý
    } catch (err) {
        dbLog(`Kết nối MongoDB thất bại: ${err.message}`);
        dbLog(`Tự động thử lại kết nối MongoDB sau ${RETRY_DELAY / 1000} giây...`);
        setTimeout(() => connectDB(MAX_RETRIES), RETRY_DELAY);
    }
}

/**
 * Kiểm tra trạng thái kết nối hiện tại
 * @returns {boolean} true nếu đang kết nối, false nếu không
 */
function isDbConnected() {
    return dbConnected;
}

module.exports = { connectDB, isDbConnected };
