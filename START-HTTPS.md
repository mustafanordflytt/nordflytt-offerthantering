# 🚀 Starta HTTPS Tunnel för Kamera-testning

## Snabbstart (2 steg)

### Steg 1: Starta Next.js
Öppna en terminal och kör:
```bash
npm run dev
```
Vänta tills du ser: `✓ Ready`

### Steg 2: Starta HTTPS Tunnel
Öppna en **NY terminal** och kör:
```bash
./start-ngrok-configured.sh
```

ELLER direkt:
```bash
./ngrok http 3000
```

✅ **Ngrok är redan konfigurerat med din authtoken!**

## 📱 Använd HTTPS URL:en

Efter att du kört ngrok kommer du se något liknande:
```
Forwarding  https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

1. **Kopiera HTTPS URL:en** (den som börjar med `https://`)
2. **Öppna den i din webbläsare** (mobil eller desktop)
3. **Klicka "Visit Site"** om du ser ngrok's varningssida

## ✅ Testa Kameran

1. Logga in på Staff App: `https://din-ngrok-url.ngrok-free.app/staff`
2. Gå till Dashboard
3. Klicka "Ta foto" på ett jobb
4. Nu fungerar kameran! 📸

## 🛑 Stoppa Tunneln

Tryck `Ctrl+C` i terminal-fönstret där ngrok körs.

## ❓ Felsökning

### "command not found: ngrok"
Kör setup-scriptet igen:
```bash
./setup-ngrok.sh
```

### "port 3000 is not available"
Kontrollera att Next.js körs:
```bash
npm run dev
```

### "Tunnel expired"
Gratis ngrok-tunnlar varar i 2 timmar. Starta om:
```bash
./ngrok http 3000
```

---

💡 **Tips**: Spara ngrok URL:en någonstans så du slipper kopiera den varje gång!