const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

async function searchDB() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fashion_store';
    try {
        await mongoose.connect(uri);
        const collections = await mongoose.connection.db.collections();
        for (let col of collections) {
            const docs = await col.find({}).toArray();
            let found = false;
            for (let doc of docs) {
                const str = JSON.stringify(doc);
                if (str.includes("collections") || str.includes("quan-au-nam")) {
                    console.log(`Found in collection ${col.collectionName}:`);
                    console.log(str);
                    found = true;
                    break;
                }
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}
searchDB();
