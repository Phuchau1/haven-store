const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { MenuModel } = require('../src/models/Menu');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Update "Hàng mới về" to "Sản phẩm mới"
    await MenuModel.updateOne(
        { id: 'menu-new' },
        { $set: { title: 'Sản phẩm mới' } }
    );

    // 2. Update "Ưu đãi Cực Hot" to "Danh mục sale" and add some children to show dropdown
    await MenuModel.updateOne(
        { id: 'menu-sale' },
        { 
            $set: { 
                title: 'Danh mục sale',
                children: [
                    { id: 'sale-30', title: 'Sale 30%', link: '/products?discounted=true', order: 1, isActive: true },
                    { id: 'sale-50', title: 'Sale 50%', link: '/products?discounted=true', order: 2, isActive: true },
                    { id: 'sale-70', title: 'Sale 70%', link: '/products?discounted=true', order: 3, isActive: true }
                ]
            } 
        }
    );

    // 3. Add "Thông tin" page menu
    await MenuModel.updateOne(
        { id: 'menu-about' },
        {
            $set: {
                id: 'menu-about',
                title: 'Thông tin',
                link: '/about',
                order: 5,
                isActive: true,
                children: []
            }
        },
        { upsert: true }
    );

    // 4. Add "Vị trí cửa hàng" page menu
    await MenuModel.updateOne(
        { id: 'menu-locations' },
        {
            $set: {
                id: 'menu-locations',
                title: 'Vị trí cửa hàng',
                link: '/locations',
                order: 6,
                isActive: true,
                children: []
            }
        },
        { upsert: true }
    );

    console.log('Menus updated successfully');
    process.exit(0);
}

run();
