require('dotenv').config();
const mongoose = require('mongoose');
const { ProductModel } = require('../src/models/Product');

async function findProduct() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://ntphau21_db_user:l4AQJN8xt0oPC8GD@cluster0.kyrsbnq.mongodb.net/fashion_store';
    await mongoose.connect(uri);

    const products = await ProductModel.find({
        $or: [
            { name: { $regex: /fitted|smart|10S25/i } },
            { sku: { $regex: /10S25SHL005_011/i } },
            { "variants.sku": { $regex: /10S25SHL005_011/i } }
        ]
    });

    console.log(`Found ${products.length} matching products:`);
    products.forEach(p => {
        console.log(`- ID: ${p.id}, SKU: ${p.sku}, Name: "${p.name}"`);
    });

    process.exit(0);
}

findProduct();
