const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { BannerModel } = require('../src/models/Banner');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found');
        process.exit(1);
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    
    console.log('Clearing old banners...');
    await BannerModel.deleteMany({});
    
    console.log('Inserting hero banner...');
    await BannerModel.create({
        id: 'banner-hero-1',
        title: 'ĐỊNH NGHĨA\nLẠI PHONG CÁCH',
        image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=1080&fit=crop',
        video: 'https://videos.pexels.com/video-files/3753716/3753716-uhd_2560_1440_25fps.mp4',
        link: '/products',
        status: 'active'
    });
    
    console.log('Banner seeded successfully!');
    process.exit(0);
}

seed();
