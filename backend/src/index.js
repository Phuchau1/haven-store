const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// Nạp biến môi trường từ .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectDB } = require('./config/db');
const { startCronJobs } = require('./services/cronService');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');
const { cacheMiddleware } = require('./middleware/cacheMiddleware');

const app = express();
const server = http.createServer(app);

// Khởi tạo Socket.io
const io = socketIo(server, {
    cors: {
        origin: process.env.NEXT_PUBLIC_FRONTEND_URL || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
});

// Gắn io vào app để dùng trong controller
app.set('io', io);

io.on('connection', (socket) => {
    logger.info(`[Socket.io] Client connected: ${socket.id}`);
    
    // Client có thể join vào room tương ứng với userId của họ để nhận thông báo cá nhân
    socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        logger.info(`[Socket.io] Socket ${socket.id} joined room user_${userId}`);
    });

    socket.on('disconnect', () => {
        logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

logger.info(`Starting server on port ${PORT}...`);
logger.info(`CWD: ${process.cwd()}`);

// --- BẢO MẬT (SECURITY) ---
app.use(helmet()); 

// --- CORS ---
app.use(cors({
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-requested-with', 'Accept']
}));

// --- LOGGING ---
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// --- PARSER ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- STATIC FILES ---
const publicUploads = path.join(__dirname, '../public/uploads');
const fs = require('fs');
if (!fs.existsSync(publicUploads)) {
    fs.mkdirSync(publicUploads, { recursive: true });
}
// --- HEALTH CHECK FOR DEPLOYMENT (RENDER / VERCEL) ---
app.get(['/', '/health'], (req, res) => {
    res.status(200).json({ status: 'ok', message: 'HAVEN Store Backend API is running smoothly', timestamp: new Date() });
});

// --- ROUTES ---
app.use('/api', globalLimiter);       // Rate limiting toàn cục — Chống DDoS
app.use('/api', cacheMiddleware);     // ⚡ Cache tầng 1 — Giảm tải MongoDB khi 1000+ users
app.use('/api', apiRoutes);

// --- XỬ LÝ LỖI (ERROR HANDLING) ---
app.use(notFoundHandler);
app.use(errorHandler);

// --- LẮNG NGHE YÊU CẦU ---
server.listen(PORT, '0.0.0.0', () => {
    logger.info(`=================================`);
    logger.info(`🚀 Server is running on 0.0.0.0:${PORT}`);
    logger.info(`=================================`);

    // Kết nối cơ sở dữ liệu MongoDB & Khởi động Cronjob ngầm sau khi mở cổng thành công
    connectDB();
    startCronJobs();
});