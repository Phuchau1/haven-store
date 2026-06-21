require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const products = await mongoose.connection.db.collection('products').find({}).toArray();
        const variantsColl = mongoose.connection.db.collection('productvariants');
        const variants = await variantsColl.find({}).toArray();

        const existingProductIds = new Set(variants.map(v => v.product_id));
        const missingProducts = products.filter(p => !existingProductIds.has(p.id));

        let newVariants = [];
        for (const p of missingProducts) {
            const colors = (p.colors && p.colors.length > 0) ? p.colors : [{name: 'Mặc định', hex: '#000'}];
            const sizes = (p.sizes && p.sizes.length > 0) ? p.sizes : ['Freesize'];

            for (const c of colors) {
                for (const s of sizes) {
                    newVariants.push({
                        id: `var-${Math.random().toString(36).substr(2, 9)}`,
                        product_id: p.id,
                        sku: `${p.id}-${c.name.substring(0,3)}-${s}-${Math.random().toString(36).substr(2,4)}`.toUpperCase().replace(/\s+/g, ''),
                        barcode: `${p.id}${Math.floor(Math.random()*10000)}`,
                        color_id: c.name,
                        size_id: s,
                        price: p.price,
                        stock: 50,
                        image: '',
                        status: 'instock',
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            }
        }

        if (newVariants.length > 0) {
            await variantsColl.insertMany(newVariants);
            console.log(`Inserted ${newVariants.length} variants for ${missingProducts.length} products.`);
        } else {
            console.log('No missing variants found.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
