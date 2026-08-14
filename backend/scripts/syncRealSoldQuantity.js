require('dotenv').config();
const mongoose = require('mongoose');
const { ProductModel } = require('../src/models/Product');
const { OrderModel } = require('../src/models/Order');
const { FlashSaleModel } = require('../src/models/FlashSale');

const run = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('MONGODB_URI environment variable is missing.');
            process.exit(1);
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // 1. Get all orders that are NOT cancelled
        const orders = await OrderModel.find({ status: { $ne: 'cancelled' } });
        console.log(`Found ${orders.length} non-cancelled orders in DB`);

        // 2. Aggregate quantities by product ID
        const soldMap = {};
        for (const order of orders) {
            if (order.items && order.items.length > 0) {
                for (const item of order.items) {
                    if (item.product && item.product.id) {
                        const pid = item.product.id;
                        soldMap[pid] = (soldMap[pid] || 0) + (item.quantity || 1);
                    }
                }
            }
        }
        console.log('Calculated real sold quantities map:', soldMap);

        // 3. Update all products' soldQuantity based on real orders
        const products = await ProductModel.find({});
        console.log(`Updating ${products.length} products with real sold quantities`);
        
        for (const p of products) {
            const realSold = soldMap[p.id] || 0;
            p.soldQuantity = realSold;
            await p.save();
        }
        console.log('Successfully synchronized all products with real sold quantities');

        // 4. Update active/upcoming Flash Sale products' soldQuantity to the real sold count
        const now = new Date();
        const activeFlashSales = await FlashSaleModel.find({
            isActive: true,
            endTime: { $gt: now }
        });
        console.log(`Found ${activeFlashSales.length} active/upcoming flash sales`);

        for (const fs of activeFlashSales) {
            for (const fp of fs.products) {
                const realSold = soldMap[fp.productId] || 0;
                fp.soldQuantity = realSold;
            }
            await fs.save();
        }
        console.log('Successfully synchronized active flash sales with real sold quantities');

        process.exit(0);
    } catch (err) {
        console.error('Error running sync script:', err);
        process.exit(1);
    }
};

run();
