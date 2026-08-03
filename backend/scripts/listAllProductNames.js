require('dotenv').config();
const mongoose = require('mongoose');
const { ProductModel } = require('../src/models/Product');

async function listNames() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://ntphau21_db_user:l4AQJN8xt0oPC8GD@cluster0.kyrsbnq.mongodb.net/fashion_store';
    await mongoose.connect(uri);

    const products = await ProductModel.find({});
    products.forEach((p, idx) => {
        console.log(`[${idx+1}] ID: ${p.id} | SKU: ${p.sku || 'N/A'} | Name: "${p.name}"`);
    });

    process.exit(0);
}

listNames();
