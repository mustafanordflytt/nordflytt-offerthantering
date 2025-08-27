#!/bin/bash

echo "🚀 Startar Serveo SSH Tunnel (enklast - ingen installation!)"
echo "=========================================================="
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

echo ""
echo "🌐 Startar SSH tunnel med serveo.net..."
echo "Din HTTPS URL kommer visas nedan:"
echo "================================="
echo ""
echo "OBS: Om du får en prompt om SSH fingerprint, skriv 'yes'"
echo ""

ssh -R 80:localhost:3000 serveo.net