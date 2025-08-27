const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`📱 REQUEST: ${req.connection.remoteAddress} - ${req.url}`);
  
  res.writeHead(200, { 
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(`
<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nordflytt - FUNGERAR!</title>
    <style>
        body { 
            font-family: -apple-system, sans-serif; 
            background: #002A5C; color: white; 
            text-align: center; padding: 30px; 
        }
        .card {
            background: rgba(255,255,255,0.1);
            border: 2px solid #38a169;
            border-radius: 15px;
            padding: 25px;
            margin: 20px 0;
        }
        .btn {
            background: #38a169;
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 16px;
            margin: 10px;
            min-width: 200px;
            min-height: 50px;
        }
    </style>
</head>
<body>
    <h1>🚛 Nordflytt Staff</h1>
    <h2>✅ MOBILACCESS FUNGERAR!</h2>
    
    <div class="card">
        <h3>📱 Anslutningsinfo</h3>
        <p>Din IP: ${req.connection.remoteAddress}</p>
        <p>Server IP: 172.20.10.3</p>
        <p>Port: 7000</p>
        <p>Tid: ${new Date().toLocaleTimeString('sv-SE')}</p>
    </div>
    
    <div class="card">
        <h3>🎯 Nästa steg</h3>
        <p>Nu när nätverket fungerar kan vi starta den riktiga appen!</p>
        <button class="btn" onclick="alert('✅ Redo att starta Nordflytt!\\n\\nAlla 5 UX-problem är lösta:\\n• GPS fallback\\n• Foto feedback\\n• 50px knappar\\n• Material synligt\\n• Smart påminnelser')">
            🚀 Starta Nordflytt App
        </button>
    </div>
    
</body>
</html>
  `);
});

server.listen(51633, '0.0.0.0', () => {
  console.log('📱 FINAL TEST SERVER STARTAD');
  console.log('=============================');
  console.log('📱 TESTA: http://172.20.10.3:51633');
  console.log('');
});