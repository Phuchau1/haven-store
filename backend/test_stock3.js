const mongoose = require('mongoose');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://ntphau21_db_user:l4AQJN8xt0oPC8GD@cluster0.kyrsbnq.mongodb.net/fashion_store');
        const db = mongoose.connection.db;
        
        const fsales = await db.collection('flashsales').find({ isActive: true }).toArray();
        let out = '';
        if (fsales.length > 0) {
            for (let fsale of fsales) {
                out += 'FLASH SALE: ' + fsale.name + '\n';
                if (fsale.products) {
                    for (let p of fsale.products) {
                        out += ' - Product ID: ' + p.productId + '\n';
                        out += '   Stock: ' + p.stockQuantity + '\n';
                        out += '   Variants: ' + JSON.stringify(p.variants) + '\n';
                    }
                }
            }
        } else {
            out = 'No active flash sales';
        }
        
        const prods = await db.collection('products').find({ id: "LF-WYOOV7" }).toArray(); // Get one product to check variants
        if (prods.length > 0) {
            out += '\n--- SAMPLE PRODUCT ---\n';
            out += JSON.stringify(prods[0].variants, null, 2);
        }

        require('fs').writeFileSync('e:\\BANWEB\\fashion-store\\backend\\test_out.txt', out);
    } catch(e) {
        require('fs').writeFileSync('e:\\BANWEB\\fashion-store\\backend\\test_out.txt', e.message);
    } finally {
        mongoose.disconnect();
    }
}
test();
