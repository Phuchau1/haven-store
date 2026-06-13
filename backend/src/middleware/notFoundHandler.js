const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [NotFoundHandler] ${msg}\n`);
    console.log(`[NotFoundHandler] ${msg}`);
}

const notFoundHandler = (req, res) => {
    log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: 'Đường dẫn API không tồn tại (404)',
    });
};

module.exports = notFoundHandler;
