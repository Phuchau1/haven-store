/**
 * ============================================================
 * CONTROLLER: XÁC THỰC NGƯỜI DÙNG (Auth)
 * Mô tả: Xử lý đăng nhập, đăng ký, quên mật khẩu, cập nhật hồ sơ,
 *        và đăng nhập bằng mạng xã hội (Google, Facebook).
 * ============================================================
 */
const crypto = require('crypto');
const axios = require('axios');
const { UserModel } = require('../models/User');
const { sendOtpEmail } = require('../services/emailService');

/**
 * @desc    Đăng nhập bằng Email và Mật khẩu
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu email hoặc mật khẩu' });
        }

        // Băm mật khẩu người dùng nhập vào bằng thuật toán SHA-256
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        // Tìm kiếm người dùng bằng email
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }

        // Chỉ kiểm tra mật khẩu đã được băm (Bảo mật: ngăn chặn Pass-the-Hash)
        const isPasswordCorrect = user.password === hashedPassword;
        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        // Tự động nâng cấp quyền Admin cho tài khoản mặc định
        const ADMIN_EMAILS = ['ntphau21@gmail.com', 'admin@havenstore.vn'];
        if (ADMIN_EMAILS.includes(email.toLowerCase().trim()) && user.role !== 'admin') {
            user.role = 'admin';
            await user.save();
        }

        // Loại bỏ trường password trước khi trả về client
        const userObj = user.toObject();
        const { password: _, ...userWithoutPassword } = userObj;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Đăng ký tài khoản mới
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã được đăng ký' });
        }

        // Kiểm tra định dạng email hợp lệ
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Email không đúng định dạng' });
        }

        // Kiểm tra định dạng số điện thoại (nếu có nhập)
        if (phone) {
            const phoneRegex = /^0[0-9]{9}$/; // Bắt đầu bằng số 0, theo sau là 9 chữ số
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và dài 10 số)' });
            }
        }

        // Băm mật khẩu trước khi lưu
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        // Tạo ID ngẫu nhiên cho user (vd: usr-a1b2c3d4e)
        const id = `usr-${Math.random().toString(36).substr(2, 9)}`;

        const ADMIN_EMAILS = ['ntphau21@gmail.com', 'admin@havenstore.vn'];
        const isDefaultAdmin = ADMIN_EMAILS.includes(email.toLowerCase().trim());

        const newUser = new UserModel({
            id,
            name,
            email,
            password: hashedPassword,
            role: isDefaultAdmin ? 'admin' : 'user',       // Mặc định admin cho ntphau21@gmail.com
            phone: phone || '',
            address: ''
        });

        // Lưu vào DB
        await newUser.save();

        const userObj = newUser.toObject();
        const { password: _, ...userWithoutPassword } = userObj;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cập nhật hồ sơ cá nhân
 * @route   PUT /api/auth/profile
 * @access  Private (Yêu cầu đăng nhập)
 */
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

        // Nếu người dùng muốn đổi mật khẩu
        if (password) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Thiếu mật khẩu hiện tại' });
            }

            // Kiểm tra mật khẩu hiện tại có đúng không (Chỉ dùng Hash)
            const currentHashed = crypto.createHash('sha256').update(currentPassword).digest('hex');
            const isPasswordCorrect = user.password === currentHashed;
            if (!isPasswordCorrect) {
                return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
            }

            // Cập nhật mật khẩu mới
            user.password = crypto.createHash('sha256').update(password).digest('hex');
        }

        // Cập nhật các thông tin khác
        if (name !== undefined) user.name = name;
        if (phone !== undefined) {
            const phoneRegex = /^0[0-9]{9}$/;
            if (phone && !phoneRegex.test(phone)) {
                return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ' });
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

/**
 * @desc    Yêu cầu cấp lại mật khẩu (Quên mật khẩu)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Thiếu email' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Email không đúng định dạng' });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email không tồn tại trên hệ thống' });
        }

        // Tạo mã OTP 6 số ngẫu nhiên
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordToken = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Cài đặt hết hạn sau 10 phút
        await user.save();

        // Gửi email chứa OTP
        sendOtpEmail(email, otp);

        res.json({ success: true, message: 'Đã gửi mã OTP đến email của bạn' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xác thực mã OTP để đổi mật khẩu
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
        }

        // Tìm user khớp email, đúng mã OTP và OTP chưa hết hạn
        const user = await UserModel.findOne({
            email,
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
        }

        res.json({ success: true, message: 'OTP hợp lệ' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Đặt lại mật khẩu mới (Sau khi nhập đúng OTP)
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        const user = await UserModel.findOne({
            email,
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
        }

        // Băm và lưu mật khẩu mới
        user.password = crypto.createHash('sha256').update(password).digest('hex');
        
        // Xóa thông tin OTP khỏi DB để tránh dùng lại
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        next(error);
    }
};

/* ============================================================
 * PHẦN XỬ LÝ ĐĂNG NHẬP QUA MẠNG XÃ HỘI (Google, Facebook)
 * ============================================================ */
const { OAuth2Client } = require('google-auth-library');

// Khởi tạo Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '70678187265-22i4v8strfakkvhvh7clrc3atks3i8g7.apps.googleusercontent.com');

/**
 * @desc    Đăng nhập bằng Google
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, message: 'Thiếu Google token' });

        // Xác thực ID Token với server của Google
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID || '70678187265-22i4v8strfakkvhvh7clrc3atks3i8g7.apps.googleusercontent.com',
        });
        
        const payload = ticket.getPayload();
        
        const ADMIN_EMAILS = ['ntphau21@gmail.com', 'admin@havenstore.vn'];
        const isDefaultAdmin = ADMIN_EMAILS.includes((payload.email || '').toLowerCase().trim());

        let user = await UserModel.findOne({ email: payload.email });

        if (!user) {
            // Lần đầu đăng nhập → Tạo tài khoản tự động
            user = new UserModel({
                id: `usr-${Math.random().toString(36).substr(2, 9)}`,
                name: payload.name,
                email: payload.email,
                googleId: payload.sub,
                avatar: payload.picture,
                role: isDefaultAdmin ? 'admin' : 'user',
            });
            await user.save();
        } else {
            if (!user.googleId) {
                user.googleId = payload.sub;
                user.avatar = payload.picture;
            }
            if (isDefaultAdmin && user.role !== 'admin') {
                user.role = 'admin';
            }
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

/**
 * @desc    Đăng nhập bằng Facebook
 * @route   POST /api/auth/facebook
 * @access  Public
 */
const facebookLogin = async (req, res, next) => {
    try {
        const { accessToken, userID } = req.body;
        if (!accessToken) return res.status(400).json({ success: false, message: 'Thiếu Facebook token' });

        // Dùng access token của Facebook để lấy thông tin user qua Graph API
        const fbRes = await axios.get(`https://graph.facebook.com/v13.0/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`);
        const payload = fbRes.data;
        
        // Nếu tài khoản Facebook đăng ký bằng SĐT, có thể không có email
        // Ta sẽ tự tạo một email giả để lưu vào DB cho hợp lệ
        const userEmail = payload.email || `${payload.id}@facebook.com`;

        let user = await UserModel.findOne({ email: userEmail });
        
        if (!user) {
            // Tạo tài khoản tự động
            user = new UserModel({
                id: `FB-${payload.id}`,
                name: payload.name,
                email: userEmail,
                facebookId: payload.id,
                avatar: payload.picture?.data?.url || '',
                role: 'user',
            });
            await user.save();
        } else if (!user.facebookId) {
            // Liên kết với tài khoản đã tồn tại
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
    verifyOtp,
    resetPassword,
    googleLogin,
    facebookLogin
};
