require('dotenv').config();
const mongoose = require('mongoose');
const { ProductModel } = require('../models/Product');
const { CategoryModel } = require('../models/Category');

const products = [
    {
        id: 'ao-blazer-01',
        name: 'Áo Blazer Oversized Premium',
        price: 1290000,
        originalPrice: 1890000,
        category: 'quan-ao',
        categoryLabel: 'Áo khoác',
        images: [
            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=750&fit=crop',
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [
            { name: 'Đen', hex: '#1a1a1a' },
            { name: 'Be', hex: '#d4c5a9' },
            { name: 'Xám', hex: '#808080' },
        ],
        description: 'Áo blazer oversized phong cách Hàn Quốc, chất liệu cao cấp, form rộng thoải mái. Phù hợp đi làm, đi chơi hay dự tiệc.',
        badge: 'Hot',
        rating: 4.8,
        reviews: 234,
        inStock: true,
    },
    {
        id: 'ao-thun-02',
        name: 'Áo Thun Unisex Cotton 100%',
        price: 350000,
        category: 'quan-ao',
        categoryLabel: 'Áo thun',
        images: [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop',
        ],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [
            { name: 'Trắng', hex: '#ffffff' },
            { name: 'Đen', hex: '#1a1a1a' },
            { name: 'Xám', hex: '#808080' },
        ],
        description: 'Áo thun unisex cotton 100% tự nhiên, mềm mịn và thoáng khí. Form regular fit phù hợp mọi dáng người.',
        badge: 'Mới',
        rating: 4.6,
        reviews: 567,
        inStock: true,
    },
    {
        id: 'quan-jean-03',
        name: 'Quần Jeans Slim Fit Xanh Đậm',
        price: 690000,
        originalPrice: 890000,
        category: 'quan-ao',
        categoryLabel: 'Quần jeans',
        images: [
            'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop',
        ],
        sizes: ['28', '29', '30', '31', '32', '34'],
        colors: [
            { name: 'Xanh đậm', hex: '#1a3a5c' },
            { name: 'Xanh nhạt', hex: '#6b8fad' },
        ],
        description: 'Quần jeans slim fit cao cấp, chất vải denim co giãn tốt, form ôm nhẹ tôn dáng.',
        badge: 'Sale',
        rating: 4.7,
        reviews: 389,
        inStock: true,
    },
    {
        id: 'ao-hoodie-04',
        name: 'Hoodie Nỉ Bông Premium',
        price: 550000,
        category: 'quan-ao',
        categoryLabel: 'Áo hoodie',
        images: [
            'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=600&h=750&fit=crop',
        ],
        sizes: ['M', 'L', 'XL', 'XXL'],
        colors: [
            { name: 'Đen', hex: '#1a1a1a' },
            { name: 'Trắng', hex: '#f5f5f5' },
            { name: 'Xám', hex: '#808080' },
            { name: 'Hồng', hex: '#e8b4b8' },
        ],
        description: 'Hoodie nỉ bông dày dặn, ấm áp cho mùa đông. Phong cách streetwear hiện đại.',
        rating: 4.9,
        reviews: 891,
        inStock: true,
    },
    {
        id: 'ao-so-mi-05',
        name: 'Áo Sơ Mi Linen Oversize',
        price: 480000,
        originalPrice: 680000,
        category: 'quan-ao',
        categoryLabel: 'Áo sơ mi',
        images: [
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=600&h=750&fit=crop',
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [
            { name: 'Trắng', hex: '#faf9f6' },
            { name: 'Be', hex: '#d4c5a9' },
            { name: 'Xanh nhạt', hex: '#b8d4e3' },
        ],
        description: 'Áo sơ mi linen tự nhiên, thoáng mát. Form oversize trendy, phù hợp mùa hè.',
        badge: 'Sale',
        rating: 4.5,
        reviews: 178,
        inStock: true,
    },
    {
        id: 'vay-dam-06',
        name: 'Váy Đầm Midi Thanh Lịch',
        price: 750000,
        category: 'quan-ao',
        categoryLabel: 'Váy đầm',
        images: [
            'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=750&fit=crop',
        ],
        sizes: ['S', 'M', 'L'],
        colors: [
            { name: 'Đen', hex: '#1a1a1a' },
            { name: 'Đỏ đô', hex: '#8b0000' },
        ],
        description: 'Váy đầm midi thiết kế thanh lịch, chất liệu rơi tự nhiên, phù hợp dự tiệc hay đi chơi.',
        badge: 'Mới',
        rating: 4.8,
        reviews: 123,
        inStock: true,
    },
    {
        id: 'giay-sneaker-07',
        name: 'Sneaker Classic Trắng',
        price: 1450000,
        originalPrice: 1890000,
        category: 'giay',
        categoryLabel: 'Sneaker',
        images: [
            'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=750&fit=crop',
        ],
        sizes: ['38', '39', '40', '41', '42', '43'],
        colors: [
            { name: 'Trắng', hex: '#ffffff' },
            { name: 'Đen', hex: '#1a1a1a' },
        ],
        description: 'Giày sneaker classic thiết kế tối giản, đế êm ái, phù hợp mọi outfit.',
        badge: 'Hot',
        rating: 4.9,
        reviews: 1205,
        inStock: true,
    },
    {
        id: 'giay-boot-08',
        name: 'Chelsea Boot Da Thật',
        price: 2190000,
        category: 'giay',
        categoryLabel: 'Boot',
        images: [
            'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=600&h=750&fit=crop',
        ],
        sizes: ['39', '40', '41', '42', '43'],
        colors: [
            { name: 'Đen', hex: '#1a1a1a' },
            { name: 'Nâu', hex: '#8B4513' },
        ],
        description: 'Chelsea boot da bò thật 100%, thiết kế cổ điển không bao giờ lỗi mốt. Đế cao su chống trơn.',
        rating: 4.7,
        reviews: 456,
        inStock: true,
    },
    {
        id: 'giay-loafer-09',
        name: 'Giày Loafer Da Lộn',
        price: 890000,
        originalPrice: 1190000,
        category: 'giay',
        categoryLabel: 'Loafer',
        images: [
            'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1626947346165-4c2288dadc2a?w=600&h=750&fit=crop',
        ],
        sizes: ['39', '40', '41', '42', '43'],
        colors: [
            { name: 'Đen', hex: '#1a1a1a' },
            { name: 'Nâu', hex: '#6b3a2a' },
            { name: 'Xám', hex: '#808080' },
        ],
        description: 'Giày loafer da lộn cao cấp, mềm mại thoải mái. Phong cách smart-casual hoàn hảo.',
        badge: 'Sale',
        rating: 4.6,
        reviews: 234,
        inStock: true,
    },
    {
        id: 'giay-the-thao-10',
        name: 'Giày Chạy Bộ Ultra Boost',
        price: 1890000,
        category: 'giay',
        categoryLabel: 'Giày thể thao',
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=750&fit=crop',
        ],
        sizes: ['38', '39', '40', '41', '42', '43', '44'],
        colors: [
            { name: 'Đen/Đỏ', hex: '#1a1a1a' },
            { name: 'Trắng/Xanh', hex: '#f0f0f0' },
        ],
        description: 'Giày chạy bộ công nghệ đệm Boost, nhẹ như bay. Hoàn hảo cho runner và người yêu thể thao.',
        badge: 'Mới',
        rating: 4.8,
        reviews: 678,
        inStock: true,
    },
    {
        id: 'dep-slide-11',
        name: 'Dép Slide Logo Minimalist',
        price: 390000,
        category: 'giay',
        categoryLabel: 'Dép',
        images: [
            'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=600&h=750&fit=crop',
        ],
        sizes: ['38', '39', '40', '41', '42', '43'],
        colors: [
            { name: 'Đen', hex: '#1a1a1a' },
            { name: 'Trắng', hex: '#f5f5f5' },
        ],
        description: 'Dép slide thiết kế tối giản, đế êm ái, phù hợp đi biển hay mặc nhà.',
        rating: 4.4,
        reviews: 321,
        inStock: true,
    },
    {
        id: 'giay-cao-got-12',
        name: 'Giày Cao Gót Mũi Nhọn Sang Trọng',
        price: 980000,
        originalPrice: 1380000,
        category: 'giay',
        categoryLabel: 'Giày cao gót',
        images: [
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600&h=750&fit=crop',
        ],
        sizes: ['35', '36', '37', '38', '39'],
        colors: [
            { name: 'Đen', hex: '#1a1a1a' },
            { name: 'Nude', hex: '#d4a574' },
            { name: 'Đỏ', hex: '#c41e3a' },
        ],
        description: 'Giày cao gót 7cm mũi nhọn thanh lịch, chất da tổng hợp cao cấp. Đế chống trơn an toàn.',
        badge: 'Sale',
        rating: 4.5,
        reviews: 189,
        inStock: true,
    },
    {
        id: 'tui-xach-13',
        name: 'Túi Tote Canvas Thời Trang',
        price: 290000,
        category: 'phu-kien',
        categoryLabel: 'Túi xách',
        images: [
            'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=750&fit=crop',
        ],
        sizes: ['One Size'],
        colors: [
            { name: 'Be', hex: '#d4c5a9' },
            { name: 'Đen', hex: '#1a1a1a' },
        ],
        description: 'Túi tote canvas bền đẹp, nhiều ngăn tiện dụng. Phong cách casual hàng ngày.',
        rating: 4.3,
        reviews: 145,
        inStock: true,
    },
    {
        id: 'mu-bucket-14',
        name: 'Mũ Bucket Hat Local Brand',
        price: 220000,
        category: 'phu-kien',
        categoryLabel: 'Mũ nón',
        images: [
            'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600&h=750&fit=crop',
            'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&h=750&fit=crop',
        ],
        sizes: ['One Size'],
        colors: [
            { name: 'Đen', hex: '#1a1a1a' },
            { name: 'Be', hex: '#d4c5a9' },
            { name: 'Xanh rêu', hex: '#556B2F' },
        ],
        description: 'Mũ bucket hat form đẹp, chất liệu cotton mềm. Phụ kiện must-have mùa hè.',
        badge: 'Mới',
        rating: 4.5,
        reviews: 278,
        inStock: true,
    },
];

const categories = [
    {
        id: 'quan-ao',
        name: 'Quần Áo',
        description: 'Áo thun, áo sơ mi, quần jeans, váy đầm...',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
        count: 6,
    },
    {
        id: 'giay',
        name: 'Giày Dép',
        description: 'Sneaker, boot, loafer, giày cao gót...',
        image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=400&fit=crop',
        count: 6,
    },
    {
        id: 'phu-kien',
        name: 'Phụ Kiện',
        description: 'Túi xách, mũ nón, thắt lưng...',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop',
        count: 2,
    },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashion-store');
        console.log('Connected to MongoDB');

        // Seed products
        let newProducts = 0;
        for (const p of products) {
            const exists = await ProductModel.findOne({ id: p.id });
            if (!exists) {
                await new ProductModel(p).save();
                newProducts++;
            }
        }
        console.log(`Seeded ${newProducts} new products`);

        // Seed categories
        let newCategories = 0;
        for (const c of categories) {
            const exists = await CategoryModel.findOne({ id: c.id });
            if (!exists) {
                await new CategoryModel(c).save();
                newCategories++;
            }
        }
        console.log(`Seeded ${newCategories} new categories`);

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seed();
