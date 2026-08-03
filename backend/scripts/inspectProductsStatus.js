require('dotenv').config();
const mongoose = require('mongoose');
const { ProductModel } = require('../src/models/Product');

async function inspect() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://phuchau:phuchau123@cluster0.mongodb.net/fashion-store?retryWrites=true&w=majority';
    await mongoose.connect(uri);
    
    const allProducts = await ProductModel.find({});
    console.log(`Total Products in DB: ${allProducts.length}`);
    
    const statuses = {};
    const inStockCounts = {};
    
    allProducts.forEach(p => {
        const st = p.status || 'undefined';
        const is = p.inStock;
        statuses[st] = (statuses[st] || 0) + 1;
        inStockCounts[is] = (inStockCounts[is] || 0) + 1;
    });

    console.log('Status counts:', statuses);
    console.log('inStock counts:', inStockCounts);
    
    // Sample first 5 products
    allProducts.slice(0, 5).forEach((p, idx) => {
        console.log(`Product [${idx + 1}] - Name: "${p.name}", Status: "${p.status}", InStock: ${p.inStock}, ID: ${p.id}`);
    });

    process.exit(0);
}

inspect();
