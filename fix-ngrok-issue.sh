#!/bin/bash

echo "🔧 Fixar ngrok UI-problem"
echo "========================"
echo ""

# Stoppa ngrok
echo "Stoppar gamla ngrok-processer..."
pkill ngrok
sleep 2

echo ""
echo "Välj en lösning:"
echo ""
echo "1) Starta ngrok med headers fix (kan hjälpa)"
echo "2) Använd localtunnel istället (rekommenderas)"
echo "3) Använd cloudflared tunnel (också gratis)"
echo ""
read -p "Ditt val (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Startar ngrok med speciella headers..."
        ./ngrok http 3000 --host-header="localhost:3000"
        ;;
    2)
        echo ""
        echo "Startar localtunnel (ingen varningssida!)..."
        echo ""
        npx -y localtunnel --port 3000
        ;;
    3)
        echo ""
        echo "Installerar och startar cloudflared..."
        echo ""
        # Ladda ner cloudflared för macOS
        if [ ! -f "./cloudflared" ]; then
            echo "Laddar ner cloudflared..."
            curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64 -o cloudflared
            chmod +x cloudflared
        fi
        echo ""
        echo "Startar Cloudflare tunnel..."
        ./cloudflared tunnel --url http://localhost:3000
        ;;
    *)
        echo "Ogiltigt val"
        exit 1
        ;;
esac