#!/bin/bash

echo "🔄 Ngrok Restart Script"
echo "======================="
echo ""

# Check and kill any existing ngrok processes
if pgrep -x "ngrok" > /dev/null; then
    echo "⚠️  Hittade existerande ngrok-processer"
    echo "🛑 Stoppar gamla ngrok-sessioner..."
    pkill -f ngrok
    sleep 2
    echo "✅ Gamla sessioner stoppade"
    echo ""
fi

# Check if Next.js is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js körs inte på port 3000"
    echo "   Kör 'npm run dev' i en annan terminal först!"
    echo ""
    exit 1
else
    echo "✅ Next.js körs på port 3000"
fi

echo ""
echo "🚀 Startar ny ngrok tunnel..."
echo ""
echo "Din HTTPS URL kommer visas nedan:"
echo "================================="
echo ""

# Start ngrok
./ngrok http 3000