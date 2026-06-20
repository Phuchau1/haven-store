// Simple auth middleware for routes that need user/admin validation
// Since this project uses frontend-managed auth (no JWT tokens from backend),
// we accept userId and role sent from the trusted frontend as headers.

const { UserModel } = require('../models/User');

// Protect: requires x-user-id header, attaches user to req.user
const protect = async (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.body?.userId;
    // Also support Authorization Bearer token that contains user id
    const authHeader = req.headers['authorization'];
    
    if (!userId && !authHeader) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }

    try {
        let user;
        if (userId) {
            user = await UserModel.findOne({ id: userId }).lean();
        }
        if (!user && authHeader) {
            // Try to find user by simple token (userId stored as token)
            const tokenId = authHeader.replace('Bearer ', '').trim();
            user = await UserModel.findOne({ id: tokenId }).lean();
            if (!user) {
                // Try by MongoDB _id as last resort
                user = await UserModel.findById(tokenId).lean().catch(() => null);
            }
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Người dùng không tồn tại.' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Xác thực thất bại.' });
    }
};

// Admin: requires user to have role === 'admin'
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền thực hiện.' });
    }
};

module.exports = { protect, admin };
