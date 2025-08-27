#!/bin/bash

echo "🚀 Startar Cloudflare Tunnel (ingen lösenord eller registrering!)"
echo "=============================================================="
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

# Check if cloudflared exists
if [ ! -f "./cloudflared" ]; then
    echo ""
    echo "📥 Laddar ner cloudflared..."
    # För macOS Apple Silicon
    if [[ $(uname -m) == 'arm64' ]]; then
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64 -o cloudflared
    else
        # För Intel Mac
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64 -o cloudflared
    fi
    chmod +x cloudflared
    echo "✅ Cloudflared nedladdat"
fi

echo ""
echo "🌐 Startar tunnel..."
echo "Din HTTPS URL kommer visas nedan:"
echo "================================="
echo ""

./cloudflared tunnel --url http://localhost:3000