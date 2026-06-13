const mongoose = require('mongoose');

let dbConnected = false;

function dbLog(msg) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [MongoDB] ${msg}`);
}

// Cấu hình Mongoose tránh cảnh báo strictQuery
mongoose.set('strictQuery', false);

// Các sự kiện giám sát kết nối MongoDB
mongoose.connection.on('connected', () => {
    dbConnected = true;
    dbLog('MongoDB connection established successfully!');
});

mongoose.connection.on('error', (err) => {
    dbConnected = false;
    dbLog(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
    dbConnected = false;
    dbLog('MongoDB disconnected! Mongoose will attempt to reconnect automatically...');
});

const MAX_RETRIES = 10;
const RETRY_DELAY = 5000;

async function connectDB(retries = MAX_RETRIES) {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fashion_store';
    
    // Ẩn mật khẩu trong log để bảo mật
    const safeUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    dbLog(`Connecting to MongoDB at: ${safeUri}...`);
    
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // Timeout khi chọn server (giảm xuống 5s thay vì 30s mặc định)
            socketTimeoutMS: 45000, // Đóng socket sau 45s không hoạt động
            maxPoolSize: 50, // Duy trì tối đa 50 kết nối song song
            connectTimeoutMS: 10000, // Timeout kết nối ban đầu là 10s
        });
        // Không cần set dbConnected = true ở đây vì sự kiện 'connected' sẽ lo việc đó
    } catch (err) {
        dbLog(`MongoDB initial connection failed: ${err.message}`);
        if (retries > 0) {
            dbLog(`Retrying connection in ${RETRY_DELAY/1000} seconds... (${retries} attempts left)`);
            setTimeout(() => connectDB(retries - 1), RETRY_DELAY);
        } else {
            dbLog('MongoDB connection failed after maximum retries. Exiting process...');
            process.exit(1); 
        }
    }
}

function isDbConnected() {
    return dbConnected;
}

module.exports = { connectDB, isDbConnected };
