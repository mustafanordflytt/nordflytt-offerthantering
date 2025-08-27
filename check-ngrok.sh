#!/bin/bash

echo "🔍 Ngrok Status Check"
echo "===================="
echo ""

# Check for running ngrok processes
if pgrep -x "ngrok" > /dev/null; then
    echo "✅ Ngrok körs redan!"
    echo ""
    echo "Aktiva ngrok-processer:"
    ps aux | grep ngrok | grep -v grep
    echo ""
    echo "💡 Tips:"
    echo "   - Om du vill starta om, kör: ./restart-ngrok.sh"
    echo "   - För att se tunneln, öppna: http://localhost:4040"
    echo "   - För att stoppa, kör: pkill ngrok"
else
    echo "❌ Ingen ngrok-process körs"
    echo ""
    echo "Starta med: ./ngrok http 3000"
fi