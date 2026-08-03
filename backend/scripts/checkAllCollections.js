require('dotenv').config();
const mongoose = require('mongoose');

async function checkCollections() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://phuchau:phuchau123@cluster0.mongodb.net/fashion-store?retryWrites=true&w=majority';
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB Atlas');
        const db = mongoose.connection.db;
        const collections = await db.collections();
        console.log('--- ALL MONGODB COLLECTIONS & COUNTS ---');
        for (let col of collections) {
            const count = await col.countDocuments();
            console.log(`Collection [${col.collectionName}]: ${count} documents`);
        }
    } catch (e) {
        console.error('Error connecting to MongoDB Atlas:', e);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkCollections();
