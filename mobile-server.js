const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 8000;

// Serve static files and proxy to Next.js
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.log('Proxy error:', err.message);
    res.status(502).send(`
      <html>
        <body>
          <h1>Server connection error</h1>
          <p>Could not connect to Next.js server</p>
          <p>Error: ${err.message}</p>
          <p><a href="javascript:location.reload()">Try again</a></p>
        </body>
      </html>
    `);
  }
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📱 Mobile access server running on:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://172.20.10.3:${PORT}`);
  console.log(`   Staff:    http://172.20.10.3:${PORT}/staff/dashboard`);
  console.log('');
  console.log('🔧 Make sure Next.js dev server is running on port 3000');
});