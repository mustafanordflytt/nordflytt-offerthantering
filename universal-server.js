const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a completely standalone server with embedded staff app
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve embedded staff app
  if (req.url === '/' || req.url === '/staff' || req.url === '/staff/dashboard') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Nordflytt Staff - Mobile</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #1a202c;
            overflow-x: hidden;
        }
        .container { 
            max-width: 100vw; 
            min-height: 100vh; 
            padding: 20px; 
        }
        .header {
            background: #002A5C;
            color: white;
            padding: 20px;
            text-align: center;
            margin: -20px -20px 20px -20px;
        }
        .login-form {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .job-card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .customer-name {
            font-size: 18px;
            font-weight: bold;
            color: #2d3748;
        }
        .status-badge {
            background: #48bb78;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .job-details {
            color: #4a5568;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 15px;
        }
        .material-calc {
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            padding: 12px;
            margin: 10px 0;
        }
        .material-calc h4 {
            color: #c2410c;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .material-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #9a3412;
            margin: 4px 0;
        }
        .action-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 15px;
        }
        .btn {
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            min-height: 44px;
        }
        .btn-primary {
            background: #3182ce;
            color: white;
        }
        .btn-outline {
            background: white;
            color: #4a5568;
            border: 2px solid #e2e8f0;
        }
        .btn:active {
            transform: scale(0.98);
        }
        .photo-section {
            background: #f7fafc;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        .photo-count {
            color: #2b6cb0;
            font-weight: bold;
            font-size: 14px;
        }
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 90%;
            text-align: center;
        }
        .success { color: #38a169; }
        .warning { color: #d69e2e; }
        .hidden { display: none; }
        .show { display: flex; }
        
        input, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            margin: 8px 0;
        }
        label {
            display: block;
            margin: 10px 0 5px 0;
            font-weight: 600;
            color: #4a5568;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚛 Nordflytt Staff</h1>
            <p>Mobil Dashboard</p>
        </div>

        <!-- Login Section -->
        <div id="loginSection" class="login-form">
            <h2>Logga in</h2>
            <label>Email:</label>
            <input type="email" id="email" value="erik.andersson@nordflytt.se" placeholder="Email">
            <label>Lösenord:</label>
            <input type="password" id="password" value="test123" placeholder="Lösenord">
            <button class="btn btn-primary" onclick="login()" style="width: 100%; margin-top: 15px;">
                Logga in
            </button>
        </div>

        <!-- Dashboard Section -->
        <div id="dashboardSection" class="hidden">
            <h2 style="margin-bottom: 20px;">Dagens jobb</h2>
            
            <!-- Packhjälp Job with Material Calculations -->
            <div class="job-card">
                <div class="job-header">
                    <div class="customer-name">Mustafa Abdulkarim</div>
                    <div class="status-badge">Pågående</div>
                </div>
                
                <div class="job-details">
                    📦 Packhjälp • 🕐 08:00-12:00<br>
                    📍 Arenavägen 60 → Kubikvägen 11<br>
                    👥 Erik A., Sofia L. • 🚚 85 m³
                </div>

                <!-- Material Calculation - Now Visible -->
                <div class="material-calc">
                    <h4>📦 Materialberäkning</h4>
                    <div class="material-row">
                        <span>25 kartonger</span>
                        <span>~128 rulle tejp</span>
                    </div>
                    <div class="material-row" style="border-top: 1px solid #fed7aa; padding-top: 8px; margin-top: 8px;">
                        <strong>Beräknat material:</strong>
                        <strong>~2625 kr</strong>
                    </div>
                </div>

                <div class="photo-section">
                    <div class="photo-count">📸 <span id="photoCount">0</span> bilder sparade</div>
                    <button class="btn btn-outline" onclick="takePhoto()" style="width: 100%; margin-top: 10px;">
                        Ta foto
                    </button>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="startTime()">
                        ▶️ Starta tid
                    </button>
                    <button class="btn btn-outline" onclick="addService()">
                        ➕ Lägg till tjänst
                    </button>
                </div>
            </div>

            <!-- Regular Moving Job -->
            <div class="job-card">
                <div class="job-header">
                    <div class="customer-name">Anna Svensson</div>
                    <div class="status-badge" style="background: #4299e1;">Kommande</div>
                </div>
                
                <div class="job-details">
                    🚚 Flytt • 🕐 13:00-17:00<br>
                    📍 Gräsmarksvägen 12 → Vasagatan 22<br>
                    👥 Marcus J., Henrik K. • 🏠 45 m³
                </div>

                <div class="action-buttons">
                    <button class="btn btn-outline" onclick="showJob('anna')">
                        👁️ Visa detaljer
                    </button>
                    <button class="btn btn-outline" onclick="navigate()">
                        🗺️ Navigera
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal for interactions -->
    <div id="modal" class="modal">
        <div class="modal-content">
            <h3 id="modalTitle">Bekräftelse</h3>
            <p id="modalMessage">Åtgärd genomförd!</p>
            <button class="btn btn-primary" onclick="closeModal()">OK</button>
        </div>
    </div>

    <script>
        let photoCount = 0;
        
        function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (email && password) {
                document.getElementById('loginSection').classList.add('hidden');
                document.getElementById('dashboardSection').classList.remove('hidden');
                showModal('Välkommen!', 'Du är nu inloggad i Nordflytt Staff systemet.');
            }
        }

        function takePhoto() {
            photoCount++;
            document.getElementById('photoCount').textContent = photoCount;
            showModal('📸 Foto taget!', \`Bild \${photoCount} har sparats för Packhjälp-jobbet.\\n\\nTid: \${new Date().toLocaleTimeString('sv-SE')}\\nGPS: Stockholm centrum\`);
        }

        function startTime() {
            showModal('⏰ Tidsloggning startad', 'Arbetstid loggas nu för Mustafa Abdulkarim-jobbet.\\n\\nStarttid: ' + new Date().toLocaleTimeString('sv-SE'));
        }

        function addService() {
            showModal('➕ Lägg till tjänster', 'Funktionen för att lägga till extra tjänster är nu tillgänglig.\\n\\n📦 Volymjustering\\n🧹 Extra städning\\n📦 Extramaterial');
        }

        function navigate() {
            showModal('🗺️ Navigation', 'Öppnar Google Maps navigation till Vasagatan 22, Stockholm');
        }

        function showJob(customer) {
            showModal('👁️ Jobbdetaljer', \`Visar fullständiga detaljer för \${customer === 'anna' ? 'Anna Svensson' : 'kund'}.\`);
        }

        function showModal(title, message) {
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalMessage').textContent = message;
            document.getElementById('modal').classList.add('show');
        }

        function closeModal() {
            document.getElementById('modal').classList.remove('show');
        }

        // Auto-login for demo
        setTimeout(() => {
            if (document.getElementById('loginSection').style.display !== 'none') {
                login();
            }
        }, 2000);
    </script>
</body>
</html>
    `);
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const PORT = 9000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 UNIVERSAL NORDFLYTT SERVER');
  console.log('================================');
  console.log('');
  console.log('📱 MOBIL URL (iPhone/Android):');
  console.log('   http://172.20.10.3:9000');
  console.log('');
  console.log('💻 LOKAL URL (dator):');
  console.log('   http://localhost:9000');
  console.log('');
  console.log('✅ FUNGERAR MED:');
  console.log('   • iPhone hotspot');
  console.log('   • Android hotspot'); 
  console.log('   • WiFi nätverk');
  console.log('   • Mobilt bredband');
  console.log('');
  console.log('🎯 Öppna URL:en på din telefon nu!');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\\n🛑 Server stoppad');
  process.exit(0);
});