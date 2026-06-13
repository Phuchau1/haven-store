const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [ErrorHandler] ${msg}\n`);
    console.error(`[ErrorHandler] ${msg}`);
}

const errorHandler = (err, req, res, next) => {
    log('Global Server Error: ' + err.message);
    res.status(500).json({
        success: false,
        message: 'Lỗi server nội bộ',
        error: err.message
    });
};

module.exports = errorHandler;
