const crypto = require('crypto');
const { UserModel } = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu email hoặc mật khẩu' });
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        // Tìm kiếm người dùng bằng email
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }

        // Hỗ trợ kiểm tra mật khẩu dạng thường hoặc dạng băm sha256
        const isPasswordCorrect = user.password === password || user.password === hashedPassword;
        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }

        const userObj = user.toObject();
        const { password: _, ...userWithoutPassword } = userObj;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        next(error);
    }
};

const register = async (req, res, next) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã được đăng ký' });
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const id = `usr-${Math.random().toString(36).substr(2, 9)}`;

        const newUser = new UserModel({
            id,
            name,
            email,
            password: hashedPassword,
            role: 'user',
            phone: phone || '',
            address: ''
        });

        await newUser.save();

        const userObj = newUser.toObject();
        const { password: _, ...userWithoutPassword } = userObj;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { id, name, phone, address, password, currentPassword } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID người dùng' });
        }

        const user = await UserModel.findOne({ id });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        // Nếu muốn thay đổi mật khẩu
        if (password) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Thiếu mật khẩu hiện tại' });
            }

            const currentHashed = crypto.createHash('sha256').update(currentPassword).digest('hex');
            const isPasswordCorrect = user.password === currentPassword || user.password === currentHashed;
            if (!isPasswordCorrect) {
                return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
            }

            user.password = crypto.createHash('sha256').update(password).digest('hex');
        }

        // Cập nhật thông tin khác
        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;

        await user.save();

        const userObj = user.toObject();
        const { password: _, ...userWithoutPassword } = userObj;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Thiếu email' });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email không tồn tại trên hệ thống' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
        await user.save();

        const resetUrl = `http://localhost:3000/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
        sendPasswordResetEmail(email, resetUrl);

        res.json({ success: true, message: 'Đã gửi email hướng dẫn đặt lại mật khẩu' });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { email, token, password } = req.body;
        if (!email || !token || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        const user = await UserModel.findOne({
            email,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
        }

        user.password = crypto.createHash('sha256').update(password).digest('hex');
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    register,
    updateProfile,
    forgotPassword,
    resetPassword
};
