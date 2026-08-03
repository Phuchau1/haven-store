require('dotenv').config();
const mongoose = require('mongoose');
const { UserModel } = require('../src/models/User');

const setAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://phuchau:phuchau123@cluster0.mongodb.net/fashion-store?retryWrites=true&w=majority';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const targetEmail = 'ntphau21@gmail.com';
        
        let user = await UserModel.findOne({ email: targetEmail });
        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`Successfully updated existing user ${targetEmail} to role: ADMIN`);
        } else {
            console.log(`User ${targetEmail} not found in DB yet. Role will auto-grant on first login/registration.`);
        }
        process.exit(0);
    } catch (err) {
        console.error('Error updating user role:', err);
        process.exit(1);
    }
};

setAdmin();
