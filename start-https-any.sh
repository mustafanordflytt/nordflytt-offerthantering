#!/bin/bash

echo "🎥 Nordflytt HTTPS Tunnel Starter"
echo "================================="
echo ""

# Check if Next.js is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js is not running on port 3000"
    echo "   Please run 'npm run dev' in another terminal first"
    echo ""
    exit 1
else
    echo "✅ Next.js is running on port 3000"
fi

echo ""
echo "Choose HTTPS tunnel method:"
echo ""
echo "1) localtunnel (No registration required) ⭐ RECOMMENDED"
echo "2) ngrok (Requires free account)"
echo "3) serveo.net (SSH tunnel, no install)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting localtunnel..."
        if ! command -v lt &> /dev/null; then
            echo "📦 Installing localtunnel first..."
            npm install -g localtunnel
        fi
        echo ""
        echo "Your HTTPS URL will appear below:"
        echo "================================="
        lt --port 3000
        ;;
    2)
        echo ""
        echo "🚀 Starting ngrok..."
        if [ ! -f "./ngrok" ]; then
            echo "❌ ngrok not found. Please run ./setup-ngrok.sh first"
            exit 1
        fi
        echo ""
        echo "⚠️  NOTE: You need to set up authtoken first!"
        echo "   See NGROK-SETUP-GUIDE.md for instructions"
        echo ""
        echo "Your HTTPS URL will appear below:"
        echo "================================="
        ./ngrok http 3000
        ;;
    3)
        echo ""
        echo "🚀 Starting serveo.net tunnel..."
        echo ""
        echo "Your HTTPS URL will appear below:"
        echo "================================="
        ssh -R 80:localhost:3000 serveo.net
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac