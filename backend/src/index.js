const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env variables BEFORE requiring internal modules
dotenv.config();
// Fallback/override with root .env.local if present
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const { connectDB } = require('./config/db');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] ${msg}\n`);
    console.log(msg);
}

const app = express();
const PORT = process.env.PORT || 5000;

log(`Starting server on port ${PORT}...`);
log(`CWD: ${process.cwd()}`);
log(`EMAIL_USER loaded: ${process.env.EMAIL_USER ? 'YES (' + process.env.EMAIL_USER + ')' : 'NO - MISSING!'}`);
log(`EMAIL_PASS loaded: ${process.env.EMAIL_PASS ? 'YES (length: ' + process.env.EMAIL_PASS.length + ')' : 'NO - MISSING!'}`);

// Kết nối cơ sở dữ liệu MongoDB (chỉ khi USE_DB=true)
connectDB();

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
    log(`Backend server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    log('Server Error: ' + err.message);
});