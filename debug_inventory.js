const mongoose = require('mongoose');
const { ProductModel } = require('./backend/src/models/Product');
const { ProductVariantModel } = require('./backend/src/models/ProductVariant');

async function test() {
    await mongoose.connect('mongodb+srv://dokhachoang135:cQy4V97F0qR6qR4A@cluster0.zoxat.mongodb.net/fashion-store?retryWrites=true&w=majority');
    const variants = await ProductVariantModel.find().lean();
    console.log('Total variants:', variants.length);
    const productIds = [...new Set(variants.map(v => v.product_id))];
    console.log('Unique product_ids in variants:', productIds);
    const products = await ProductModel.find({ id: { $in: productIds } }).lean();
    console.log('Products found:', products.length, products.map(p => p.id));
    
    // Find a variant that has 'Unknown' product
    const productMap = {};
    products.forEach(p => productMap[p.id] = p);
    
    const unknownVariants = variants.filter(v => !productMap[v.product_id]);
    console.log('Unknown variants (no matching product):', unknownVariants.length);
    if(unknownVariants.length > 0) {
        console.log('Example unknown variant:', unknownVariants[0]);
    }
    
    // ALSO test with _id just in case?
    const productsById = await ProductModel.find({ _id: { $in: productIds } }).lean();
    console.log('Products found by _id:', productsById.length);

    process.exit(0);
}
test().catch(console.error);
