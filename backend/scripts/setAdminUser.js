require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const { UserModel } = require('../src/models/User');

const setAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ntphau21_db_user:l4AQJN8xt0oPC8GD@cluster0.kyrsbnq.mongodb.net/fashion_store';
        await mongoose.connect(mongoUri);
        console.log('✅ Đã kết nối MongoDB Database');

        const targetEmail = process.argv[2] || 'ntphau21@gmail.com';
        const targetRole = process.argv[3] || 'admin';
        
        let user = await UserModel.findOne({ email: { $regex: new RegExp(`^${targetEmail.trim()}$`, 'i') } });
        if (user) {
            user.role = targetRole;
            user.isLocked = false;
            await user.save();
            console.log(`🎉 Thành công: Đã nâng cấp tài khoản [${user.email}] lên vai trò [${targetRole.toUpperCase()}]!`);
        } else {
            console.log(`⚠️ Không tìm thấy người dùng [${targetEmail}] trong DB. Khi tài khoản này đăng ký/đăng nhập, hệ thống sẽ tự động gán quyền ADMIN.`);
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi khi cập nhật quyền:', err);
        process.exit(1);
    }
};

setAdmin();
