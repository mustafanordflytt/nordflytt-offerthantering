#!/bin/bash

# Cloudflare Tunnel Quick Deploy for Testing
echo "🌐 Cloudflare Tunnel Quick Deploy"
echo "================================="
echo ""
echo "Detta script skapar en temporär publik URL för din lokala API"
echo "Perfect för att testa med GPT innan permanent deployment!"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Installerar Cloudflare Tunnel..."
    
    # För macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflare/cloudflare/cloudflared
    else
        # För Linux
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb
        rm cloudflared-linux-amd64.deb
    fi
fi

echo ""
echo "🚀 Startar lokal server om den inte redan körs..."
# Kolla om servern redan körs
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Startar Next.js server..."
    npm run dev > /tmp/next-server.log 2>&1 &
    SERVER_PID=$!
    echo "Väntar på att servern ska starta..."
    sleep 10
fi

echo ""
echo "🌐 Skapar publik tunnel..."
echo "============================"
echo ""

# Starta Cloudflare tunnel
cloudflared tunnel --url http://localhost:3000 &
TUNNEL_PID=$!

# Vänta lite för att tunneln ska etableras
sleep 5

echo ""
echo "📝 VIKTIGT: Din temporära publika URL visas ovan!"
echo "=================================================="
echo ""
echo "Exempel på URL: https://XXXX-XXXX-XXXX.trycloudflare.com"
echo ""
echo "🤖 Uppdatera din GPT med dessa URLs:"
echo "- https://XXXX.trycloudflare.com/api/recruitment/candidate-info"
echo "- https://XXXX.trycloudflare.com/api/recruitment/lowisa-webhook-simple"
echo "- https://XXXX.trycloudflare.com/api/recruitment/save-conversation"
echo ""
echo "⚠️  OBSERVERA: Detta är endast för testning!"
echo "För produktion, använd DIRECT-SERVER-DEPLOY.md"
echo ""
echo "Tryck Ctrl+C för att stoppa tunneln"
echo ""

# Håll scriptet igång
wait $TUNNEL_PID