const https = require('https');
const httpProxy = require('http-proxy-middleware');
const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');

// Skapa självsignerat certifikat om det inte finns
if (!fs.existsSync('localhost.pem') || !fs.existsSync('localhost-key.pem')) {
  console.log('📜 Skapar självsignerat certifikat...');
  
  try {
    // Skapa certifikat med openssl
    execSync(`openssl req -x509 -out localhost.pem -keyout localhost-key.pem \
      -newkey rsa:2048 -nodes -sha256 \
      -subj '/CN=localhost' -extensions EXT -config <( \
       printf "[dn]\\nCN=localhost\\n[req]\\ndistinguished_name = dn\\n[EXT]\\nsubjectAltName=DNS:localhost\\nkeyUsage=digitalSignature\\nextendedKeyUsage=serverAuth")`, 
      { shell: '/bin/bash' }
    );
  } catch (error) {
    // Fallback: enklare certifikat
    execSync('openssl req -new -x509 -days 365 -nodes -out localhost.pem -keyout localhost-key.pem -subj "/CN=localhost"');
  }
  
  console.log('✅ Certifikat skapat');
}

const app = express();

// Proxy alla requests till Next.js
app.use('/', httpProxy.createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: false,
  ws: true,
  logLevel: 'error'
}));

// HTTPS server
const server = https.createServer({
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem')
}, app);

server.listen(3001, () => {
  console.log('');
  console.log('🔐 HTTPS Proxy startad!');
  console.log('========================');
  console.log('');
  console.log('📱 Öppna i webbläsaren:');
  console.log('   https://localhost:3001');
  console.log('');
  console.log('⚠️  Webbläsaren kommer varna om certifikatet');
  console.log('   1. Klicka "Avancerat" eller "Advanced"');
  console.log('   2. Klicka "Fortsätt till localhost"');
  console.log('');
  console.log('✅ Sen kan du testa kameran med HTTPS!');
  console.log('');
});