require('dotenv').config();
const mongoose = require('mongoose');
const SpinReward = require('./src/models/SpinReward');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        await SpinReward.deleteMany({});
        console.log('Cleared existing spin rewards');

        const rewards = [
            {
                reward: "Chúc bạn may mắn lần sau",
                type: "none",
                coupon_code: "",
                discount_value: 0,
                probability: 60, // Tăng tỉ lệ lên 60%
                valid_hours: 0,
                active: true
            },
            {
                reward: "Giảm 20.000đ",
                type: "fixed",
                coupon_code: "SPIN20",
                discount_value: 20000,
                probability: 15,
                valid_hours: 24,
                active: true
            },
            {
                reward: "Giảm 30.000đ",
                type: "fixed",
                coupon_code: "SPIN30",
                discount_value: 30000,
                probability: 10,
                valid_hours: 24,
                active: true
            },
            {
                reward: "Giảm 50.000đ",
                type: "fixed",
                coupon_code: "SPIN50",
                discount_value: 50000,
                probability: 6,
                valid_hours: 24,
                active: true
            },
            {
                reward: "Freeship",
                type: "shipping",
                coupon_code: "FREESHIP",
                discount_value: 30000,
                probability: 5,
                valid_hours: 24,
                active: true
            },
            {
                reward: "Giảm 100.000đ",
                type: "fixed",
                coupon_code: "SPIN100",
                discount_value: 100000,
                probability: 2,
                valid_hours: 24,
                active: true
            },
            {
                reward: "Giảm 15%",
                type: "percent",
                coupon_code: "SPIN15P",
                discount_value: 15,
                probability: 1.5,
                valid_hours: 24,
                active: true
            },
            {
                reward: "Giảm 20%",
                type: "percent",
                coupon_code: "SPIN20P",
                discount_value: 20,
                probability: 0.5,
                valid_hours: 24,
                active: true
            }
        ];

        await SpinReward.insertMany(rewards);
        console.log('Seed spin rewards successfully');
        process.exit();
    })
    .catch(err => {
        console.error('Error seeding rewards:', err);
        process.exit(1);
    });
