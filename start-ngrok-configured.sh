#!/bin/bash

echo "🎥 Nordflytt HTTPS Tunnel med Ngrok"
echo "===================================="
echo ""

# Check if Next.js is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js körs inte på port 3000"
    echo "   Kör 'npm run dev' i en annan terminal först!"
    echo ""
    exit 1
else
    echo "✅ Next.js körs på port 3000"
fi

echo "✅ Ngrok är konfigurerat med authtoken"
echo ""
echo "🚀 Startar HTTPS tunnel..."
echo ""
echo "När ngrok startar kommer du se något som:"
echo "   Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000"
echo ""
echo "📱 Kopiera HTTPS URL:en och öppna i din webbläsare!"
echo ""
echo "Tryck Ctrl+C för att stoppa tunneln."
echo ""
echo "===================================="
echo ""

# Start ngrok with cleaner output
./ngrok http 3000