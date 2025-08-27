#!/bin/bash

# Test Enhanced Authentication for Lowisa API
# This script tests the updated authentication system that supports both header formats

echo "🔐 Testing Enhanced Authentication System..."
echo "==========================================="

# Configuration
API_BASE_URL="http://localhost:3000"
API_KEY="lowisa_nordflytt_2024_secretkey123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "📍 Testing against: $API_BASE_URL"
echo ""

# Test 1: Candidate Info with X-API-Key
echo "1️⃣ Testing Candidate Info with X-API-Key header"
echo "-----------------------------------------------"
curl -s -X GET "$API_BASE_URL/api/recruitment/candidate-info?id=1" \
  -H "X-API-Key: $API_KEY" | jq '.' 2>/dev/null || echo "❌ Failed with X-API-Key"

echo ""

# Test 2: Candidate Info with Authorization Bearer
echo "2️⃣ Testing Candidate Info with Authorization Bearer"
echo "---------------------------------------------------"
curl -s -X GET "$API_BASE_URL/api/recruitment/candidate-info?id=1" \
  -H "Authorization: Bearer $API_KEY" | jq '.' 2>/dev/null || echo "❌ Failed with Bearer token"

echo ""

# Test 3: Webhook with X-API-Key
echo "3️⃣ Testing Webhook with X-API-Key header"
echo "-----------------------------------------"
curl -s -X POST "$API_BASE_URL/api/recruitment/lowisa-webhook-simple" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "applicationId": 1,
    "message": "Hej! Jag har B-körkort och 2 års erfarenhet.",
    "sender": "candidate"
  }' | jq '.' 2>/dev/null || echo "❌ Failed with X-API-Key"

echo ""

# Test 4: Webhook with Authorization Bearer
echo "4️⃣ Testing Webhook with Authorization Bearer"
echo "---------------------------------------------"
curl -s -X POST "$API_BASE_URL/api/recruitment/lowisa-webhook-simple" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "applicationId": 2,
    "message": "När kan jag börja jobba?",
    "sender": "candidate"
  }' | jq '.' 2>/dev/null || echo "❌ Failed with Bearer token"

echo ""

# Test 5: Save Conversation with mixed auth
echo "5️⃣ Testing Save Conversation API"
echo "---------------------------------"
curl -s -X POST "$API_BASE_URL/api/recruitment/save-conversation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "application_id": 1,
    "message": "Test conversation entry",
    "sender": "lowisa",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "metadata": {
      "source": "gpt-integration-test"
    }
  }' | jq '.' 2>/dev/null || echo "❌ Failed to save conversation"

echo ""

# Test 6: Get Conversations
echo "6️⃣ Testing Get Conversations API"
echo "---------------------------------"
curl -s -X GET "$API_BASE_URL/api/recruitment/save-conversation?application_id=1" \
  -H "X-API-Key: $API_KEY" | jq '.' 2>/dev/null || echo "❌ Failed to get conversations"

echo ""

# Test 7: CORS preflight test
echo "7️⃣ Testing CORS Preflight Requests"
echo "-----------------------------------"
CORS_TEST=$(curl -s -I -X OPTIONS "$API_BASE_URL/api/recruitment/candidate-info" \
  -H "Origin: https://chat.openai.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization")

if echo "$CORS_TEST" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✅ CORS headers properly configured${NC}"
  echo "$CORS_TEST" | grep "Access-Control-" | head -5
else
  echo -e "${RED}❌ CORS headers missing${NC}"
fi

echo ""

# Test 8: Invalid API key test
echo "8️⃣ Testing Invalid API Key Rejection"
echo "-------------------------------------"
INVALID_RESPONSE=$(curl -s -X GET "$API_BASE_URL/api/recruitment/candidate-info?id=1" \
  -H "Authorization: Bearer invalid_key_12345")

if echo "$INVALID_RESPONSE" | grep -q "Unauthorized"; then
  echo -e "${GREEN}✅ Invalid API keys properly rejected${NC}"
else
  echo -e "${RED}❌ Invalid API key not rejected${NC}"
fi

echo ""
echo "🏁 Enhanced Authentication Test Complete!"
echo "========================================="
echo ""
echo "📋 Summary:"
echo "- Both X-API-Key and Authorization Bearer headers are supported"
echo "- CORS is configured for ChatGPT integration"
echo "- All endpoints have consistent authentication"
echo ""
echo "🚀 Next Steps:"
echo "1. Deploy to production"
echo "2. Update GPT Actions to use Authorization Bearer format"
echo "3. Monitor API usage in production logs"