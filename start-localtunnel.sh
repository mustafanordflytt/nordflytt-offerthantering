#!/bin/bash

echo "🚀 Starting HTTPS tunnel with localtunnel (no registration needed!)"
echo "==================================================================="
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
echo "Starting localtunnel..."
echo "Your HTTPS URL will appear below:"
echo ""

# Run localtunnel with npx (no installation needed)
npx localtunnel --port 3000