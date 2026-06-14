const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Có thể null nếu đăng nhập bằng MXH
    googleId: { type: String },
    facebookId: { type: String },
    avatar: { type: String },
    role: { type: String, required: true, enum: ['user', 'admin', 'warehouse_manager', 'warehouse_staff'], default: 'user' },
    phone: { type: String },
    address: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
}, { timestamps: true });

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = { UserModel };
