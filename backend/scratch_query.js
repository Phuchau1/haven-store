require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    const products = await mongoose.connection.db.collection('products').find({ 
        $expr: { $gt: ["$originalPrice", "$price"] }
    }).toArray();
    console.log('Products with originalPrice > price count:', products.length);
    console.log('Sample:', products[0]);
    process.exit(0);
});
