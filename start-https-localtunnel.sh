#!/bin/bash

echo "🎥 Nordflytt HTTPS Tunnel (localtunnel)"
echo "========================================"
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

# Check if localtunnel is installed
if ! command -v lt &> /dev/null; then
    echo "📦 Installing localtunnel..."
    npm install -g localtunnel
fi

echo ""
echo "🚀 Starting HTTPS tunnel with localtunnel..."
echo "   This doesn't require any registration!"
echo ""
echo "=========================================="
echo ""

# Start localtunnel with a custom subdomain for consistency
lt --port 3000 --subdomain nordflytt-test

# Note: If the subdomain is taken, it will generate a random one