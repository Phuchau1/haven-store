require('dotenv').config();
const mongoose = require('mongoose');
const { ProductModel } = require('../src/models/Product');

async function cleanTitles() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://ntphau21_db_user:l4AQJN8xt0oPC8GD@cluster0.kyrsbnq.mongodb.net/fashion_store';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas');

    const products = await ProductModel.find({});
    console.log(`Scanning ${products.length} products for title formatting cleanup...`);

    let updatedCount = 0;

    for (const p of products) {
        let originalName = p.name || '';
        let cleanedName = originalName
            .replace(/\.([a-zA-ZÀ-ỹ])/g, ' $1')          // "Nút.Fitted" -> "Nút Fitted"
            .replace(/\bSmart shirt\b/gi, 'Sơ Mi Cao Cấp') // Clean up redundant english mixed text "Smart shirt"
            .replace(/\s+/g, ' ')
            .trim();

        if (originalName !== cleanedName) {
            console.log(`Updating product [${p.id}]:`);
            console.log(`   BEFORE: "${originalName}"`);
            console.log(`   AFTER:  "${cleanedName}"`);
            p.name = cleanedName;
            await p.save();
            updatedCount++;
        }
    }

    console.log(`Cleaned up titles for ${updatedCount} products.`);
    process.exit(0);
}

cleanTitles();
