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
    // Đọc URI từ biến môi trường, fallback về localhost nếu không có
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fashion_store';

    // Ẩn thông tin đăng nhập trong log để bảo mật
    const safeUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    dbLog(`Đang kết nối đến MongoDB tại: ${safeUri}...`);

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,  // Timeout khi chọn MongoDB server (5 giây)
            socketTimeoutMS:          45000, // Đóng socket sau 45 giây không hoạt động
            maxPoolSize:              50,    // Số kết nối song song tối đa trong connection pool
            connectTimeoutMS:         10000, // Timeout kết nối lần đầu (10 giây)
        });
        // Lưu ý: không cần set dbConnected = true ở đây
        // vì sự kiện 'connected' ở trên sẽ tự xử lý
    } catch (err) {
        dbLog(`Kết nối MongoDB thất bại: ${err.message}`);

        if (retries > 0) {
            // Còn lần thử → chờ rồi thử lại
            dbLog(`Thử lại sau ${RETRY_DELAY / 1000} giây... (còn ${retries} lần thử)`);
            setTimeout(() => connectDB(retries - 1), RETRY_DELAY);
        } else {
            // Hết lần thử → dừng tiến trình server
            dbLog('Kết nối MongoDB thất bại sau số lần thử tối đa. Đang tắt server...');
            process.exit(1);
        }
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
