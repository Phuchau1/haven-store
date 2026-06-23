const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// Nạp biến môi trường từ .env.local
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const { connectDB } = require('./config/db');
const { startCronJobs } = require('./services/cronService');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

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

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

// Khởi động các Cronjob chạy ngầm
startCronJobs();

// --- BẢO MẬT (SECURITY) ---
app.use(helmet()); 

// --- CORS ---
app.use(cors({
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- LOGGING ---
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// --- PARSER ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROUTES ---
app.use('/api', apiRoutes);

// --- XỬ LÝ LỖI (ERROR HANDLING) ---
app.use(notFoundHandler);
app.use(errorHandler);

// --- LẮNG NGHE YÊU CẦU ---
server.listen(PORT, () => {
    logger.info(`=================================`);
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`=================================`);
});