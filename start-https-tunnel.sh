#!/bin/bash

echo "🚀 Starting HTTPS tunnel for Nordflytt Staff App"
echo ""
echo "📋 Checklist:"
echo "   ✓ Make sure Next.js is running on port 3000 (npm run dev)"
echo "   ✓ This will create an HTTPS tunnel to test camera functionality"
echo ""
echo "Starting ngrok..."
echo ""

# Start ngrok with better output formatting
./ngrok http 3000 --log=stdout --log-level=info

# Note: The above command will show the HTTPS URL in the terminal
# Look for a line like: "Forwarding https://xxxxx.ngrok-free.app -> http://localhost:3000"