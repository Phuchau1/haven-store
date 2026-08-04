const http = require('http');
const https = require('https');

https.get('https://fashion-store-backend.onrender.com/api/categories', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data.substring(0, 1000));
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
