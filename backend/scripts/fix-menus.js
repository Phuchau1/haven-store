const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { MenuModel } = require('../src/models/Menu');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const menus = [
    {
        id: 'menu-home',
        title: 'Trang chủ',
        link: '/',
        order: 1,
        isActive: true,
        children: []
    },
    {
        id: 'menu-sale',
        title: 'Danh mục sale',
        link: '/products?discounted=true',
        order: 2,
        isActive: true,
        children: [
            { id: 'sale-30', title: 'Sale 30%', link: '/products?discount=30', order: 1, isActive: true },
            { id: 'sale-50', title: 'Sale 50%', link: '/products?discount=50', order: 2, isActive: true },
            { id: 'sale-70', title: 'Sale 70%', link: '/products?discount=70', order: 3, isActive: true }
        ]
    },
    {
        id: 'menu-nam',
        title: 'Nam',
        link: '/collections/nam',
        order: 3,
        isActive: true,
        children: [
            {
                id: 'col-ao-nam', title: 'Áo Nam', link: '/collections/ao-nam', order: 1, isActive: true,
                children: [
                    { id: 'item-ao-somi', title: 'Áo sơ mi nam', link: '/collections/ao-so-mi-nam', order: 1, isActive: true },
                    { id: 'item-ao-polo', title: 'Áo polo nam', link: '/collections/ao-polo-nam', order: 2, isActive: true },
                    { id: 'item-ao-thun', title: 'Áo thun nam', link: '/collections/ao-thun-nam', order: 3, isActive: true },
                    { id: 'item-ao-khoac', title: 'Áo khoác nam', link: '/collections/ao-khoac-nam', order: 4, isActive: true }
                ]
            },
            {
                id: 'col-quan-nam', title: 'Quần Nam', link: '/collections/quan-nam', order: 2, isActive: true,
                children: [
                    { id: 'item-quan-au', title: 'Quần âu nam', link: '/collections/quan-au-nam', order: 1, isActive: true },
                    { id: 'item-quan-jean', title: 'Quần jean nam', link: '/collections/quan-jean-nam', order: 2, isActive: true },
                    { id: 'item-quan-kaki', title: 'Quần kaki nam', link: '/collections/quan-kaki-nam', order: 3, isActive: true },
                    { id: 'item-quan-short', title: 'Quần short nam', link: '/collections/quan-short-nam', order: 4, isActive: true }
                ]
            },
            {
                id: 'col-bo-nam', title: 'Bộ đồ nam', link: '/collections/bo-do-nam', order: 3, isActive: true,
                children: [
                    { id: 'item-bo-vest', title: 'Bộ vest nam', link: '/collections/bo-vest-nam', order: 1, isActive: true }
                ]
            },
            {
                id: 'col-pk-nam', title: 'Phụ kiện', link: '/collections/phu-kien-nam', order: 4, isActive: true,
                children: [
                    { id: 'item-giay-da', title: 'Giày da nam', link: '/collections/giay-da-nam', order: 1, isActive: true },
                    { id: 'item-vi-da', title: 'Ví da nam', link: '/collections/vi-da-nam', order: 2, isActive: true },
                    { id: 'item-day-lung', title: 'Dây lưng nam', link: '/collections/day-lung-nam', order: 3, isActive: true },
                    { id: 'item-dep-nam', title: 'Dép nam', link: '/collections/dep-nam', order: 4, isActive: true }
                ]
            }
        ]
    },
    {
        id: 'menu-nu',
        title: 'Nữ',
        link: '/collections/do-nu',
        order: 4,
        isActive: true,
        children: [
            {
                id: 'col-ao-nu', title: 'Áo Nữ', link: '/collections/ao-nu', order: 1, isActive: true,
                children: [
                    { id: 'item-somi-nu', title: 'Áo sơ mi nữ', link: '/collections/ao-so-mi-nu', order: 1, isActive: true },
                    { id: 'item-polo-nu', title: 'Áo polo nữ', link: '/collections/ao-polo-nu', order: 2, isActive: true },
                    { id: 'item-tshirt-nu', title: 'Áo T-shirt nữ', link: '/collections/ao-thun-nu', order: 3, isActive: true },
                    { id: 'item-khoac-nu', title: 'Áo khoác nữ', link: '/collections/ao-khoac-nu', order: 4, isActive: true }
                ]
            },
            {
                id: 'col-quan-nu', title: 'Quần Nữ', link: '/collections/quan-nu', order: 2, isActive: true,
                children: [
                    { id: 'item-quan-au-nu', title: 'Quần âu nữ', link: '/collections/quan-au-nu', order: 1, isActive: true },
                    { id: 'item-quan-jean-nu', title: 'Quần jean nữ', link: '/collections/quan-jean-nu', order: 2, isActive: true },
                    { id: 'item-quan-short-nu', title: 'Quần short nữ', link: '/collections/quan-short-nu', order: 3, isActive: true }
                ]
            },
            {
                id: 'col-vay-dam', title: 'Váy / Đầm', link: '/collections/vay-dam', order: 3, isActive: true,
                children: [
                    { id: 'item-vay-lien', title: 'Váy liền đầm', link: '/collections/vay-lien-dam', order: 1, isActive: true },
                    { id: 'item-chan-vay', title: 'Chân váy', link: '/collections/chan-vay', order: 2, isActive: true }
                ]
            },
            {
                id: 'col-pk-nu', title: 'Phụ kiện', link: '/collections/phu-kien-nu', order: 4, isActive: true,
                children: [
                    { id: 'item-giay-nu', title: 'Giày dép nữ', link: '/collections/giay-dep-nu', order: 1, isActive: true },
                    { id: 'item-tui-xach', title: 'Túi xách', link: '/collections/tui-xach', order: 2, isActive: true }
                ]
            }
        ]
    },
    {
        id: 'menu-about',
        title: 'Thông tin',
        link: '/about',
        order: 5,
        isActive: true,
        children: []
    },
    {
        id: 'menu-locations',
        title: 'Vị trí cửa hàng',
        link: '/locations',
        order: 6,
        isActive: true,
        children: []
    }
];

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        await MenuModel.deleteMany({});
        console.log('Cleared existing menus');
        
        await MenuModel.insertMany(menus);
        console.log('Inserted correct menus');
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
