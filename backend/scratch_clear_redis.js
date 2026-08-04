require('dotenv').config();
const { delCache } = require('./src/utils/redisClient');

async function run() {
    console.log('Clearing category cache...');
    await delCache('categories:all');
    await delCache('categories:active');
    console.log('Cache cleared!');
    process.exit(0);
}
run();
