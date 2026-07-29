const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://ntphau21_db_user:l4AQJN8xt0oPC8GD@cluster0.kyrsbnq.mongodb.net/fashion_store';

const MenuSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    link: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    children: { type: Array, default: [] }
}, { strict: false });

const MenuModel = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);

async function updateMenuNames() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // 1. Cập nhật "Thông tin" -> "Tin tức"
    const res1 = await MenuModel.updateMany(
        { $or: [{ id: 'menu-about' }, { title: 'Thông tin' }, { link: '/about' }] },
        { $set: { title: 'Tin tức' } }
    );
    console.log('📌 Updated "Thông tin" -> "Tin tức":', res1.modifiedCount);

    // 2. Cập nhật "Vị trí cửa hàng" -> "Hệ thống cửa hàng"
    const res2 = await MenuModel.updateMany(
        { $or: [{ id: 'menu-locations' }, { title: 'Vị trí cửa hàng' }, { link: '/locations' }] },
        { $set: { title: 'Hệ thống cửa hàng' } }
    );
    console.log('📌 Updated "Vị trí cửa hàng" -> "Hệ thống cửa hàng":', res2.modifiedCount);

    const allMenus = await MenuModel.find({ isActive: true }).sort({ order: 1 });
    console.log('📋 Current Active Menus in Database:');
    allMenus.forEach(m => console.log(`  - [${m.id}] "${m.title}" -> ${m.link}`));

    await mongoose.disconnect();
    console.log('✅ Update completed successfully!');
}

updateMenuNames().catch(err => {
    console.error('❌ Error updating menu names:', err);
    process.exit(1);
});
