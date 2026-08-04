require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    const menus = mongoose.connection.db.collection('menus');
    
    await menus.updateOne(
        { id: 'menu-sale' },
        {
            $set: {
                children: [
                    {
                        id: 'sale-all',
                        title: 'Tất cả sản phẩm Sale',
                        link: '/collections/sale',
                        order: 0,
                        isActive: true
                    },
                    {
                        id: 'sale-20',
                        title: 'Sale 20%+',
                        link: '/products?discount=20',
                        order: 1,
                        isActive: true
                    },
                    {
                        id: 'sale-30',
                        title: 'Sale 30%+',
                        link: '/products?discount=30',
                        order: 2,
                        isActive: true
                    },
                    {
                        id: 'sale-40',
                        title: 'Sale 40%+',
                        link: '/products?discount=40',
                        order: 3,
                        isActive: true
                    },
                    {
                        id: 'sale-50',
                        title: 'Sale 50%+',
                        link: '/products?discount=50',
                        order: 4,
                        isActive: true
                    }
                ]
            }
        }
    );
    
    console.log('Menu updated!');
    process.exit(0);
});
