const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const { CategoryModel } = require('../src/models/Category');

async function run() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fashion_store';
    try {
        await mongoose.connect(uri);
        const existing = await CategoryModel.findOne({ id: 'cat-womens' });
        if (!existing) {
            await CategoryModel.create({
                id: 'cat-womens',
                name: 'Đồ Nữ',
                image: 'https://images.unsplash.com/photo-1550614000-4b95dd247db0?w=500&auto=format&fit=crop&q=60',
                order: 4,
                isActive: true
            });
            console.log("Added Đồ Nữ category!");
        } else {
            console.log("Category already exists");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

run();
