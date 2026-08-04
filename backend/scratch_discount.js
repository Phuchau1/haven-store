require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    const products = await mongoose.connection.db.collection('products').find({ 
        $expr: { $gt: ["$originalPrice", "$price"] }
    }).toArray();
    
    let lt30 = 0, gte30 = 0, gte40 = 0, gte50 = 0;
    
    products.forEach(p => {
        const disc = (p.originalPrice - p.price) / p.originalPrice;
        if (disc >= 0.5) gte50++;
        else if (disc >= 0.4) gte40++;
        else if (disc >= 0.3) gte30++;
        else lt30++;
    });
    
    console.log(`Total sale: ${products.length}`);
    console.log(`< 30%: ${lt30}`);
    console.log(`30-39%: ${gte30}`);
    console.log(`40-49%: ${gte40}`);
    console.log(`>= 50%: ${gte50}`);
    process.exit(0);
});
