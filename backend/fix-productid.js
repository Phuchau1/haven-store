const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://ntphau21_db_user:l4AQJN8xt0oPC8GD@cluster0.kyrsbnq.mongodb.net/fashion_store';

async function fixMissingProductId() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const db = mongoose.connection.db;

    // Fix bản ghi thiếu field productId
    const r1 = await db.collection('inventories').updateMany(
        { productId: { $exists: false } },
        { $set: { productId: '' } }
    );
    console.log('🔧 Fixed (no productId field):', r1.modifiedCount);

    // Fix bản ghi có productId = null
    const r2 = await db.collection('inventories').updateMany(
        { productId: null },
        { $set: { productId: '' } }
    );
    console.log('🔧 Fixed (null productId):', r2.modifiedCount);

    const total = await db.collection('inventories').countDocuments({});
    console.log('📦 Total inventory records:', total);

    await mongoose.disconnect();
    console.log('✅ Done! All records now have productId field.');
}

fixMissingProductId().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
