require('dotenv').config();
const mongoose = require('mongoose');
const { ProductModel } = require('../src/models/Product');

async function testApi() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://phuchau:phuchau123@cluster0.mongodb.net/fashion-store?retryWrites=true&w=majority';
    await mongoose.connect(uri);
    const count = await ProductModel.countDocuments();
    const activeCount = await ProductModel.countDocuments({ status: { $ne: 'draft' }, inStock: { $ne: false } });
    console.log(`Total Products in DB: ${count}`);
    console.log(`Active Published Products in DB: ${activeCount}`);
    process.exit(0);
}
testApi();
