const https = require('https');
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');

// Skapa certifikat om det inte finns
if (!fs.existsSync('localhost.pem') || !fs.existsSync('localhost-key.pem')) {
  console.log('📜 Skapar självsignerat certifikat...');
  
  try {
    execSync('openssl req -new -x509 -days 365 -nodes -out localhost.pem -keyout localhost-key.pem -subj "/CN=localhost"');
    console.log('✅ Certifikat skapat');
  } catch (error) {
    console.error('❌ Kunde inte skapa certifikat. Kör manuellt:');
    console.log('openssl req -new -x509 -days 365 -nodes -out localhost.pem -keyout localhost-key.pem -subj "/CN=localhost"');
    process.exit(1);
  }
}

// HTTPS proxy server
const server = https.createServer({
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem')
});

server.on('request', (req, res) => {
  // Proxy request till Next.js
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxy, { end: true });
  
  proxy.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error');
  });
});

server.listen(3001, () => {
  console.log('');
  console.log('🔐 HTTPS Server startad!');
  console.log('========================');
  console.log('');
  console.log('📱 Öppna i webbläsaren:');
  console.log('   https://localhost:3001/staff');
  console.log('');
  console.log('⚠️  Om du får certifikatvarning:');
  console.log('   Chrome: Klicka "Avancerat" → "Fortsätt till localhost"');
  console.log('   Safari: Klicka "Visa detaljer" → "Besök webbplatsen"');
  console.log('   Firefox: Klicka "Avancerat" → "Acceptera risken"');
  console.log('');
  console.log('✅ Sen kan du testa kameran med HTTPS!');
  console.log('');
  console.log('Tryck Ctrl+C för att stoppa');
});