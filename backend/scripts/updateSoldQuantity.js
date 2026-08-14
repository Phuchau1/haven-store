require('dotenv').config();
const mongoose = require('mongoose');
const { ProductModel } = require('../src/models/Product');
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

        // 1. Update all products' soldQuantity to a realistic random number between 15 and 75
        const products = await ProductModel.find({});
        console.log(`Found ${products.length} products to update`);
        
        for (const p of products) {
            const mockSold = Math.floor(Math.random() * (75 - 15 + 1)) + 15;
            p.soldQuantity = mockSold;
            await p.save();
        }
        console.log('Successfully updated all products soldQuantity');

        // 2. Update active Flash Sale products' soldQuantity to a realistic random number
        const now = new Date();
        const activeFlashSales = await FlashSaleModel.find({
            isActive: true,
            endTime: { $gt: now }
        });
        console.log(`Found ${activeFlashSales.length} active/upcoming flash sales`);

        for (const fs of activeFlashSales) {
            for (const fp of fs.products) {
                const maxStock = fp.stockQuantity || 100;
                const mockSold = Math.floor(maxStock * (0.15 + Math.random() * 0.5));
                fp.soldQuantity = Math.max(1, mockSold);
            }
            await fs.save();
        }
        console.log('Successfully updated active flash sale soldQuantity');

        process.exit(0);
    } catch (err) {
        console.error('Error running update script:', err);
        process.exit(1);
    }
};

run();
