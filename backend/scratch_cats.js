require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    const categories = await mongoose.connection.db.collection('categories').find({}).toArray();
    console.log(JSON.stringify(categories, null, 2));
    process.exit(0);
});
