const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { MenuModel } = require('../src/models/Menu');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    await MenuModel.updateOne(
        { id: 'menu-sale' },
        { 
            $set: { 
                children: [
                    { id: 'sale-30', title: 'Sale 30%', link: '/products?discount=30', order: 1, isActive: true },
                    { id: 'sale-40', title: 'Sale 40%', link: '/products?discount=40', order: 2, isActive: true },
                    { id: 'sale-50', title: 'Sale 50%', link: '/products?discount=50', order: 3, isActive: true }
                ]
            } 
        }
    );

    console.log('Sale menu updated to 30, 40, 50');
    process.exit(0);
}

run();
