# 🔐 Ngrok Setup Guide - Authtoken Required

## ❌ Fel: "authentication failed"
Ngrok kräver nu ett gratis konto och authtoken för att fungera.

## ✅ Lösning (5 minuter)

### Steg 1: Skapa Gratis Konto
1. Gå till: https://dashboard.ngrok.com/signup
2. Registrera dig med email eller GitHub/Google
3. Bekräfta din email

### Steg 2: Hämta Din Authtoken
1. Efter inloggning, gå till: https://dashboard.ngrok.com/get-started/your-authtoken
2. Kopiera din authtoken (ser ut som: `2abc123XYZ...`)

### Steg 3: Konfigurera Ngrok
Kör detta kommando med DIN authtoken:
```bash
./ngrok config add-authtoken DIN_AUTHTOKEN_HÄR
```

Exempel:
```bash
./ngrok config add-authtoken 2abc123XYZ456789_abcdefghijklmnop
```

### Steg 4: Testa Igen
Nu fungerar det:
```bash
./ngrok http 3000
```

## 🎯 Alternativ Lösning: Använd Andra Verktyg

Om du inte vill registrera dig kan du använda dessa alternativ:

### Option 1: localtunnel (Ingen registrering)
```bash
# Installera
npm install -g localtunnel

# Kör
lt --port 3000
```

### Option 2: Cloudflare Tunnel (Gratis)
```bash
# Installera
npm install -g cloudflared

# Kör
cloudflared tunnel --url http://localhost:3000
```

### Option 3: serveo.net (Ingen installation)
```bash
ssh -R 80:localhost:3000 serveo.net
```

## 🚀 Snabbfix med localtunnel

Låt mig skapa ett alternativt script som använder localtunnel istället: