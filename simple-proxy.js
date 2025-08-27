const http = require('http');
const httpProxy = require('http-proxy-middleware');
const express = require('express');

const app = express();

// Proxy all requests to Next.js
const proxy = httpProxy.createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true
});

app.use(proxy);

const server = app.listen(8080, '0.0.0.0', () => {
  console.log('📱 Mobile Proxy Server running on:');
  console.log('   http://172.20.10.3:8080');
  console.log('   http://0.0.0.0:8080');
});
EOF < /dev/null