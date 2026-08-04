require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    const productsCol = mongoose.connection.db.collection('products');
    const products = await productsCol.find({}).project({ price: 1, name: 1 }).sort({ price: -1 }).limit(10).toArray();
    console.log(JSON.stringify(products, null, 2));
    process.exit(0);
});
