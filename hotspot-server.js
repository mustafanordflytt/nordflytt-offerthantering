const http = require('http');
const { spawn } = require('child_process');

// Create a simple HTTP server that works with iPhone hotspot
const server = http.createServer((req, res) => {
  // Set CORS headers to allow access from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve a simple test page
  if (req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Hotspot Test</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            padding: 20px; 
            background: #1a202c;
            color: white;
            text-align: center;
          }
          .container { 
            max-width: 400px; 
            margin: 0 auto; 
            background: #2d3748; 
            padding: 30px; 
            border-radius: 12px;
          }
          .success { 
            background: #38a169; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            font-size: 18px;
          }
          .next-step {
            background: #3182ce;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          a {
            color: #90cdf4;
            text-decoration: none;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📱 iPhone Hotspot Test</h1>
          <div class="success">
            ✅ Anslutningen fungerar via hotspot!
          </div>
          <div class="next-step">
            🔗 Öppna appen genom att gå till:<br>
            <a href="http://localhost:3030">localhost:3030</a>
          </div>
          <p>Din hotspot: ${process.env.WIFI_NETWORK || 'Mustafa – iPhone'}</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  // Proxy requests to Next.js
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxy = http.request(options, (proxyRes) => {
    // Copy status and headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxy.on('error', (err) => {
    console.log('Next.js not responding, serving fallback...');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Startar Nordflytt App...</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            padding: 20px; 
            background: #002A5C;
            color: white;
            text-align: center;
          }
          .loading { animation: pulse 2s infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        </style>
      </head>
      <body>
        <div class="loading">
          <h1>🚛 Nordflytt</h1>
          <p>Startar appen...</p>
          <p>Vänta medan Next.js startar upp.</p>
        </div>
        <script>
          setTimeout(() => location.reload(), 3000);
        </script>
      </body>
      </html>
    `);
  });

  req.pipe(proxy);
});

const PORT = 3030;
server.listen(PORT, () => {
  console.log('🔥 HOTSPOT SERVER STARTAD!');
  console.log('');
  console.log('📱 VIKTIGT: Anslut din telefon till SAMMA WiFi som datorn!');
  console.log('   WiFi: Mustafa – iPhone (din hotspot)');
  console.log('');
  console.log('📱 Öppna på telefonen:');
  console.log('   http://localhost:3030/test  (TEST FÖRST)');
  console.log('   http://localhost:3030/staff/dashboard  (SEDAN APPEN)');
  console.log('');
  console.log('🔧 Startar Next.js automatiskt...');
  
  // Start Next.js in background
  const nextProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    cwd: process.cwd()
  });
  
  nextProcess.stdout.on('data', (data) => {
    if (data.toString().includes('Ready')) {
      console.log('✅ Next.js redo! Nu kan du använda appen.');
    }
  });
  
  process.on('SIGINT', () => {
    console.log('\\n🛑 Stoppar servrar...');
    nextProcess.kill();
    process.exit(0);
  });
});