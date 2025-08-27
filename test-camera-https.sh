#!/bin/bash

echo "🎥 Nordflytt Camera Test Helper"
echo "================================"
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

# Check if ngrok exists
if [ ! -f "./ngrok" ]; then
    echo "❌ ngrok not found"
    echo "   Running setup..."
    ./setup-ngrok.sh
fi

echo ""
echo "🚀 Starting HTTPS tunnel..."
echo ""
echo "When ngrok starts, you will see something like:"
echo "   Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000"
echo ""
echo "📱 Copy the HTTPS URL and open it in your browser to test the camera!"
echo ""
echo "Press Ctrl+C to stop the tunnel when done."
echo ""
echo "=========================================="
echo ""

# Start ngrok
./ngrok http 3000