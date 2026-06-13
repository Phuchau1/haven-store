const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { MenuModel } = require('../src/models/Menu');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Update "Danh mục sale" children links
    await MenuModel.updateOne(
        { id: 'menu-sale' },
        { 
            $set: { 
                'children.$[c30].link': '/products?discount=30',
                'children.$[c50].link': '/products?discount=50',
                'children.$[c70].link': '/products?discount=70'
            } 
        },
        {
            arrayFilters: [
                { 'c30.id': 'sale-30' },
                { 'c50.id': 'sale-50' },
                { 'c70.id': 'sale-70' }
            ]
        }
    );

    console.log('Menu links updated');
    process.exit(0);
}

run();
