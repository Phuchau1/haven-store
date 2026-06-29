const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Article = require('../models/Article');
const { UserModel: User } = require('../models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

const seedArticles = async () => {
    try {
        const adminUser = await User.findOne({ role: 'admin' });
        
        await Article.deleteMany({});
        console.log('Old articles deleted.');

        const articles = [
            {
                title: 'Xu Hướng Thời Trang Mùa Hè 2026',
                slug: 'xu-huong-thoi-trang-mua-he-2026',
                content: '<p>Mùa hè năm nay, các nhà thiết kế tập trung vào sự thoải mái và màu sắc rực rỡ. Những bộ cánh làm từ chất liệu linen (lanh) và cotton mỏng nhẹ đang lên ngôi.</p><ul><li>Màu sắc chủ đạo: Xanh ngọc, vàng chanh và trắng tinh khôi.</li><li>Kiểu dáng: Form rộng, quần ống suông và váy hoa nhí.</li></ul><p>PH Store đã cập nhật bộ sưu tập mới nhất để bạn sẵn sàng cho những chuyến du lịch biển.</p>',
                author: adminUser ? adminUser._id : null,
                status: 'published',
                thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=60',
                tags: ['Thời trang', 'Mùa hè', 'Xu hướng'],
                views: 120
            },
            {
                title: 'Cách Phối Đồ Với Áo Sơ Mi Trắng Không Bao Giờ Lỗi Mốt',
                slug: 'cach-phoi-do-voi-ao-so-mi-trang-khong-bao-gio-loi-mot',
                content: '<p>Áo sơ mi trắng là một item "must-have" trong tủ đồ của bất kỳ ai. Dưới đây là 3 cách phối đồ cơ bản mà vẫn cực kỳ cuốn hút:</p><ol><li><strong>Phong cách công sở:</strong> Phối cùng quần âu màu navy hoặc đen, thêm một chiếc thắt lưng da.</li><li><strong>Phong cách dạo phố:</strong> Mix cùng quần jeans xanh cơ bản và giày sneaker trắng.</li><li><strong>Phong cách đi chơi:</strong> Kết hợp với chân váy chữ A hoặc quần short, mang lại sự trẻ trung, năng động.</li></ol><p>Tham khảo ngay các mẫu sơ mi trắng mới nhất tại gian hàng của PH Store nhé!</p>',
                author: adminUser ? adminUser._id : null,
                status: 'published',
                thumbnail: 'https://images.unsplash.com/photo-1434389678059-42b588365288?w=800&auto=format&fit=crop&q=60',
                tags: ['Tips', 'Phối đồ', 'Sơ mi'],
                views: 350
            }
        ];

        await Article.insertMany(articles);
        console.log('Seed articles successfully!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedArticles();
