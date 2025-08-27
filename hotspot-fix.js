const http = require('http');

// Server som bör fungera med iPhone hotspot
const server = http.createServer((req, res) => {
  console.log(`📱 Anslutning från: ${req.connection.remoteAddress} - ${req.headers['user-agent']}`);
  
  res.writeHead(200, { 
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hotspot Test - SUCCESS!</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white; padding: 30px; text-align: center; min-height: 100vh;
            display: flex; align-items: center; justify-content: center; margin: 0;
        }
        .container { max-width: 400px; }
        .success { font-size: 72px; margin-bottom: 20px; animation: bounce 1s infinite; }
        @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        h1 { margin-bottom: 20px; }
        .info { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
        .next-btn {
            background: white; color: #38a169; border: none; padding: 15px 30px;
            border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer;
            margin: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">🎉</div>
        <h1>HOTSPOT FUNGERAR!</h1>
        <div class="info">
            <p><strong>✅ Anslutning etablerad</strong></p>
            <p>Din telefon kan nå servern via hotspot</p>
            <p>IP: 172.20.10.3:8080</p>
            <p>Tid: ${new Date().toLocaleString('sv-SE')}</p>
        </div>
        <button class="next-btn" onclick="testApp()">
            🚀 Starta Nordflytt App
        </button>
    </div>
    
    <script>
        function testApp() {
            alert('✅ SUCCESS! Nätverket fungerar!\\n\\nNu kan vi starta den riktiga Nordflytt appen med alla funktioner.');
            // In real implementation, redirect to the actual app
            window.location.href = '/nordflytt-app';
        }
    </script>
</body>
</html>
  `);
});

// Prova port 8080 som ofta fungerar med hotspots
server.listen(8080, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Kunde inte starta på port 8080:', err.message);
    // Fallback till port 3000
    server.listen(3000, '0.0.0.0', () => {
      console.log('🔄 Fallback till port 3000');
      console.log('📱 Testa: http://172.20.10.3:3000');
    });
  } else {
    console.log('');
    console.log('🔥 HOTSPOT SERVER REDO!');
    console.log('========================');
    console.log('');
    console.log('📱 VIKTIGA INSTRUKTIONER:');
    console.log('1. Se till att "Personal Hotspot" är PÅ i iPhone');
    console.log('2. Kontrollera att Mac är ansluten till din iPhone hotspot');
    console.log('3. Testa URL:en nedan på din iPhone:');
    console.log('');
    console.log('📱 http://172.20.10.3:8080');
    console.log('');
    console.log('🔧 Om det inte fungerar, testa:');
    console.log('• Stäng av WiFi på iPhone, slå på igen');
    console.log('• Starta om Personal Hotspot');
    console.log('• Testa http://localhost:8080 först');
    console.log('');
  }
});

server.on('connection', (socket) => {
  console.log(`🔗 Ny anslutning: ${socket.remoteAddress}:${socket.remotePort}`);
});

process.on('SIGINT', () => {
  console.log('\\n🛑 Hotspot server stoppad');
  process.exit(0);
});