const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// Load env variables BEFORE requiring internal modules
dotenv.config();
// Fallback/override with root .env.local if present
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const { connectDB } = require('./config/db');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

logger.info(`Starting server on port ${PORT}...`);
logger.info(`CWD: ${process.cwd()}`);

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

// --- BẢO MẬT (SECURITY) ---
app.use(helmet()); // Bảo vệ HTTP Headers

// Giới hạn số lượng Request (Chống DDoS, Brute-force)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 1000, // Giới hạn 1000 request mỗi IP mỗi 15 phút
    message: { success: false, message: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút.' }
});
app.use('/api/', apiLimiter);

// --- GHI LOG (LOGGING) ---
// Tích hợp morgan với winston để ghi log HTTP requests
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

app.use(cors());
app.use(express.json());

// Prevent caching for all API responses
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Root path for testing
app.get('/', (req, res) => {
    res.send('PH Store Backend API with MongoDB is running (JS Version)...');
});

// Register all API routes under /api
app.use('/api', apiRoutes);

// Register 404 handler
app.use(notFoundHandler);

// Register global error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
    logger.info(`Backend server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    logger.error('Server Error: ' + err.message);
});