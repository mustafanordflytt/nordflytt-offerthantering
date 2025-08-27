#!/bin/bash

echo "🚀 Starting Nordflytt server for mobile access..."
echo "📱 Your mobile URL will be: http://192.168.1.228:3000/staff"
echo ""

# Kill any existing Next.js processes
pkill -f "next dev" || true

# Wait a moment
sleep 2

# Clear Next.js cache
rm -rf .next/cache

# Start the server with proper host binding
echo "Starting server..."
npm run dev

# The server is now running on http://192.168.1.228:3000