const express = require('express');
const apiRoutes = require('./src/routes/index');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

const server = app.listen(0, () => {
  const port = server.address().port;
  console.log(`Server listening on port ${port}`);
  
  const http = require('http');
  http.get(`http://localhost:${port}/api/categories`, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
      server.close();
      process.exit(0);
    });
  }).on('error', (err) => {
    console.log('Request Error:', err.message);
    server.close();
    process.exit(1);
  });
});
