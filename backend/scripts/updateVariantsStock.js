const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env and root .env.local
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const { ProductModel } = require('../src/models/Product');

async function runMigration() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fashion_store';
    console.log(`Connecting to MongoDB at: ${uri}...`);
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB.');

        const products = await ProductModel.find({});
        console.log(`Found ${products.length} products to migrate.`);

        for (const product of products) {
            console.log(`Migrating product: ${product.name} (${product.id})`);
            const colors = product.colors || [];
            const sizes = product.sizes || [];
            const existingVariants = product.variants || [];
            const updatedVariants = [];

            colors.forEach((color) => {
                sizes.forEach((size) => {
                    const existing = existingVariants.find(
                        (v) => v.color === color.name && v.size === size
                    );
                    
                    if (existing) {
                        updatedVariants.push(existing);
                    } else {
                        // Generate random stock. 10% chance to be 0 (out of stock) for robust testing!
                        const isZeroStock = Math.random() < 0.15;
                        const stock = isZeroStock ? 0 : Math.floor(Math.random() * 45) + 5;
                        
                        updatedVariants.push({
                            color: color.name,
                            size: size,
                            stock: stock
                        });
                    }
                });
            });

            product.variants = updatedVariants;
            await product.save();
            console.log(`-> Migrated ${updatedVariants.length} variants for ${product.id}`);
        }

        console.log('Database migration completed successfully!');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed.');
    }
}

runMigration();
