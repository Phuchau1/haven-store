const mongoose = require('mongoose');
const { ProductVariantModel } = require('../src/models/ProductVariant');

mongoose.connect('mongodb+srv://ntphau21_db_user:l4AQJN8xt0oPC8GD@cluster0.kyrsbnq.mongodb.net/fashion_store').then(async () => {
    try {
        const variant = await ProductVariantModel.findOne({ stock: { $gt: 5 } });
        if(variant) {
            console.log('Found variant:', variant.product_id, variant.size_id, variant.color_id);
            const res = await fetch('https://fashion-backend-93lh.onrender.com/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: 'Test E2E Script',
                    phone: '0987654321',
                    email: 'ntphau21@gmail.com',
                    address: '123 E2E Test St, Hanoi',
                    paymentMethod: 'cod',
                    totalAmount: 100000,
                    items: [{
                        product: { id: variant.product_id, name: 'Test Product E2E' },
                        selectedSize: variant.size_id,
                        selectedColor: { name: variant.color_id, hex: '#FFFFFF' },
                        quantity: 1
                    }]
                })
            });
            const data = await res.json();
            console.log('Order creation response:', data);
        } else {
            console.log('No variant found with stock > 5');
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
});
