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
    
    console.log('Inserting banners...');
    await BannerModel.create([
        {
            id: 'banner-hero-1',
            title: 'ĐỊNH NGHĨA\nLẠI PHONG CÁCH',
            image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=1080&fit=crop',
            video: 'https://videos.pexels.com/video-files/3753716/3753716-uhd_2560_1440_25fps.mp4',
            link: '/products',
            type: 'hero',
            status: 'active'
        },
        {
            id: 'banner-middle-1',
            title: 'NEW JOURNAL / NEW COLLECTION',
            image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&auto=format&fit=crop&q=80',
            link: '/products',
            type: 'middle',
            status: 'active'
        },
        {
            id: 'banner-middle-2',
            title: 'ELEGANT DESIGN / TIMELESS STYLE',
            image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
            link: '/products',
            type: 'middle',
            status: 'active'
        },
        {
            id: 'banner-middle-3',
            title: 'URBAN CHIC / MODERN ESSENTIALS',
            image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1600&auto=format&fit=crop&q=80',
            link: '/products',
            type: 'middle',
            status: 'active'
        },
        {
            id: 'banner-collection-1',
            title: 'BST XUÂN HÈ 2026: EASY DAILY | BẮT NHỊP SỐNG - HÒA NHỊP SỐNG',
            subtitle: '✨ BST Xuân Hè cập bến mang theo tinh thần "Easy" thoải mái trải nghiệm cùng những trang phục "Daily" tiện dụng mỗi ngày. HAVEN tin rằng, khi trang phục đủ nhẹ tênh, tâm trí sẽ tự khắc rộng mở để bạn bắt trọn nhịp điệu cuộc sống. Sẵn sàng cho một diện mạo rạng rỡ và trải nghiệm đầy năng lượng cùng HAVEN ngay hôm nay!',
            image: '/bst-xuan-he-2026.png',
            link: '/products',
            link_text: 'Xem chi tiết',
            type: 'collection',
            status: 'active'
        }
    ]);
    
    console.log('Banners seeded successfully!');
    process.exit(0);
}

seed();
