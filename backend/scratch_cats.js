require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    const menus = await mongoose.connection.db.collection('menus').find({}).toArray();
    console.log(JSON.stringify(menus, null, 2));
    
    const products = await mongoose.connection.db.collection('products').countDocuments();
    console.log('Total products:', products);
    process.exit(0);
});
