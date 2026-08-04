require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const { ProductModel } = require('./src/models/Product');
    const { ProductVariantModel } = require('./src/models/ProductVariant');

    const products = await ProductModel.find({});
    console.log('Found', products.length, 'products');

    for (const product of products) {
        if (!product.variants || !Array.isArray(product.variants)) continue;

        const currentVariantIds = [];

        for (const v of product.variants) {
            const color = v.color || 'Mặc định';
            const size = v.size || 'Mặc định';
            const stock = v.stock || 0;
            const sku = v.sku || `${product.id}-${color}-${size}`;
            const id = `${product.id}-${color}-${size}`;

            currentVariantIds.push(id);

            await ProductVariantModel.findOneAndUpdate(
                { product_id: product.id, size_id: size, color_id: color },
                {
                    $set: {
                        id,
                        product_id: product.id,
                        size_id: size,
                        color_id: color,
                        price: v.price || product.price,
                        sku,
                        stock,
                        status: product.status || 'active'
                    },
                    $setOnInsert: {
                        reserved_stock: 0,
                        warehouse_stocks: [{ warehouse_id: 'WH-MAIN', stock }]
                    }
                },
                { upsert: true, new: true, runValidators: false }
            );
        }
    }
    console.log('All variants synced successfully!');
    process.exit(0);
}).catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
