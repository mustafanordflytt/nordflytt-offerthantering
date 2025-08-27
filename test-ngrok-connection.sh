#!/bin/bash

echo "🔍 Testing Ngrok Connection"
echo "=========================="
echo ""

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | cut -d'"' -f4 | grep https | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ No ngrok tunnel found"
    exit 1
fi

echo "✅ Ngrok URL: $NGROK_URL"
echo ""

# Test local Next.js
echo "Testing local Next.js..."
LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
echo "   Local status: $LOCAL_STATUS"

# Test ngrok tunnel
echo ""
echo "Testing ngrok tunnel..."
NGROK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $NGROK_URL)
echo "   Ngrok status: $NGROK_STATUS"

# Test specific paths
echo ""
echo "Testing specific paths..."
echo "   Homepage: $(curl -s -o /dev/null -w "%{http_code}" $NGROK_URL/)"
echo "   Staff: $(curl -s -o /dev/null -w "%{http_code}" $NGROK_URL/staff)"
echo "   API: $(curl -s -o /dev/null -w "%{http_code}" $NGROK_URL/api/health)"

echo ""
echo "💡 Tips:"
echo "   - Om du ser Ngrok varningssida, klicka 'Visit Site'"
echo "   - Prova i incognito-läge"
echo "   - Kolla konsolen för fel (F12)"
echo ""
echo "📱 Din HTTPS URL för testning:"
echo "   $NGROK_URL"
echo "   $NGROK_URL/staff"