const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Nordflytt Test Server</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
          padding: 20px; 
          background: #f0f4f8;
          color: #2d3748;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          padding: 30px; 
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
          color: #002A5C; 
          text-align: center; 
          margin-bottom: 30px;
        }
        .status { 
          background: #e6fffa; 
          border: 2px solid #38b2ac; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 20px 0;
        }
        .test-links { 
          background: #fef5e7; 
          border: 2px solid #d69e2e; 
          padding: 15px; 
          border-radius: 8px;
        }
        a { 
          color: #002A5C; 
          text-decoration: none; 
          font-weight: bold;
          display: block;
          margin: 10px 0;
          padding: 10px;
          background: #edf2f7;
          border-radius: 6px;
        }
        a:hover { 
          background: #e2e8f0; 
        }
        .info { 
          font-size: 14px; 
          color: #4a5568; 
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="header">🚛 Nordflytt Mobil Test</h1>
        
        <div class="status">
          <h3>✅ Anslutningen fungerar!</h3>
          <p>Din telefon kan nå servern på ${req.headers.host}</p>
          <p>IP-adress: ${req.connection.remoteAddress}</p>
          <p>User-Agent: ${req.headers['user-agent']}</p>
        </div>
        
        <div class="test-links">
          <h3>🔗 Testa Next.js appen:</h3>
          <a href="http://172.20.10.3:3000" target="_blank">→ Next.js Server (Port 3000)</a>
          <a href="http://172.20.10.3:3000/staff" target="_blank">→ Staff Portal</a>
          <a href="http://172.20.10.3:3000/staff/dashboard" target="_blank">→ Staff Dashboard</a>
        </div>
        
        <div class="info">
          <p><strong>Felsökning:</strong></p>
          <p>• Om länkarna ovan inte fungerar, kontrollera att Next.js servern körs</p>
          <p>• Se till att båda enheter är på samma WiFi-nätverk</p>
          <p>• Inloggning: erik.andersson@nordflytt.se / test123</p>
        </div>
        
        <script>
          // Auto-refresh every 30 seconds for testing
          setTimeout(() => location.reload(), 30000);
        </script>
      </div>
    </body>
    </html>
  `;
  
  res.end(html);
});

const PORT = 8081;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🧪 Nordflytt Test Server körs:');
  console.log(`   📱 Mobile URL: http://172.20.10.3:${PORT}`);
  console.log('   🌐 Local URL: http://localhost:' + PORT);
  console.log('');
  console.log('💡 Öppna mobil-URL:an på din telefon för att testa anslutningen');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\\n🛑 Test server stoppad');
  process.exit(0);
});