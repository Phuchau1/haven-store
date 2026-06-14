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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Email không đúng định dạng' });
        }

        // Validate phone if provided
        if (phone) {
            const phoneRegex = /^0[0-9]{9}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và dài 10 số)' });
            }
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
        if (phone !== undefined) {
            const phoneRegex = /^0[0-9]{9}$/;
            if (phone && !phoneRegex.test(phone)) {
                return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và dài 10 số)' });
            }
            user.phone = phone;
        }
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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Email không đúng định dạng' });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email không tồn tại trên hệ thống' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'https://fashion-frontend-imqb.onrender.com';
        const resetUrl = `${frontendUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
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

const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '70678187265-22i4v8strfakkvhvh7clrc3atks3i8g7.apps.googleusercontent.com');

const googleLogin = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, message: 'Thiếu Google token' });

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID || '70678187265-22i4v8strfakkvhvh7clrc3atks3i8g7.apps.googleusercontent.com',
        });
        const payload = ticket.getPayload();
        
        let user = await UserModel.findOne({ email: payload.email });
        if (!user) {
            user = new UserModel({
                id: `usr-${Math.random().toString(36).substr(2, 9)}`,
                name: payload.name,
                email: payload.email,
                googleId: payload.sub,
                avatar: payload.picture,
                role: 'user',
            });
            await user.save();
        } else if (!user.googleId) {
            user.googleId = payload.sub;
            user.avatar = payload.picture;
            await user.save();
        }

        const userObj = user.toObject();
        delete userObj.password;
        res.json({ success: true, user: userObj });
    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(401).json({ success: false, message: 'Đăng nhập Google thất bại' });
    }
};

const facebookLogin = async (req, res, next) => {
    try {
        const { accessToken, userID } = req.body;
        if (!accessToken) return res.status(400).json({ success: false, message: 'Thiếu Facebook token' });

        const fbRes = await axios.get(`https://graph.facebook.com/v13.0/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`);
        const payload = fbRes.data;
        
        if (!payload.email) {
            return res.status(400).json({ success: false, message: 'Không thể lấy email từ Facebook. Vui lòng thử phương thức khác.' });
        }

        let user = await UserModel.findOne({ email: payload.email });
        if (!user) {
            user = new UserModel({
                id: `usr-${Math.random().toString(36).substr(2, 9)}`,
                name: payload.name,
                email: payload.email,
                facebookId: payload.id,
                avatar: payload.picture?.data?.url,
                role: 'user',
            });
            await user.save();
        } else if (!user.facebookId) {
            user.facebookId = payload.id;
            user.avatar = payload.picture?.data?.url;
            await user.save();
        }

        const userObj = user.toObject();
        delete userObj.password;
        res.json({ success: true, user: userObj });
    } catch (error) {
        console.error('Facebook Login Error:', error);
        res.status(401).json({ success: false, message: 'Đăng nhập Facebook thất bại' });
    }
};

module.exports = {
    login,
    register,
    updateProfile,
    forgotPassword,
    resetPassword,
    googleLogin,
    facebookLogin
};
