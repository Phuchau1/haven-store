require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    const productsCol = mongoose.connection.db.collection('products');
    const product = await productsCol.findOne({ id: 'dep-slide-11' });
    console.log(JSON.stringify(product, null, 2));
    process.exit(0);
});
