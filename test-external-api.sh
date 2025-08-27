#!/bin/bash

# Test External API Endpoints for Lowisa GPT Integration
# This script tests if the Nordflytt API endpoints are accessible from external sources

echo "🧪 Testing Nordflytt External API Endpoints..."
echo "================================================"

# Configuration
API_BASE_URL="https://api.nordflytt.se"
API_KEY="lowisa_nordflytt_2024_secretkey123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🔧 Configuration:"
echo "Base URL: $API_BASE_URL"
echo "API Key: ${API_KEY:0:10}..."
echo ""

# Test 1: Get Candidate Info with correct header format
echo "1️⃣ Testing GET /api/recruitment/candidate-info"
echo "----------------------------------------"

# Test with X-API-Key header (most common)
echo "Testing with X-API-Key header..."
RESPONSE1=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE_URL/api/recruitment/candidate-info?id=1" \
  -H "X-API-Key: $API_KEY")

HTTP_CODE1=$(echo "$RESPONSE1" | tail -n 1)
BODY1=$(echo "$RESPONSE1" | head -n -1)

if [ "$HTTP_CODE1" = "200" ]; then
  echo -e "${GREEN}✅ Success with X-API-Key header${NC}"
  echo "Response: $(echo $BODY1 | cut -c1-100)..."
else
  echo -e "${RED}❌ Failed with X-API-Key header (HTTP $HTTP_CODE1)${NC}"
fi

echo ""

# Test with Authorization Bearer header (as shown in your example)
echo "Testing with Authorization Bearer header..."
RESPONSE2=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE_URL/api/recruitment/candidate-info?id=1" \
  -H "Authorization: Bearer $API_KEY")

HTTP_CODE2=$(echo "$RESPONSE2" | tail -n 1)
BODY2=$(echo "$RESPONSE2" | head -n -1)

if [ "$HTTP_CODE2" = "200" ]; then
  echo -e "${GREEN}✅ Success with Authorization Bearer header${NC}"
  echo "Response: $(echo $BODY2 | cut -c1-100)..."
else
  echo -e "${RED}❌ Failed with Authorization Bearer header (HTTP $HTTP_CODE2)${NC}"
  echo "Response: $BODY2"
fi

echo ""
echo "2️⃣ Testing POST /api/recruitment/lowisa-webhook"
echo "----------------------------------------"

# Prepare test payload
PAYLOAD='{
  "applicationId": 1,
  "message": "Hej! Jag är intresserad av jobbet som flyttare.",
  "sender": "candidate",
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
}'

# Test webhook with X-API-Key
echo "Testing webhook with X-API-Key header..."
RESPONSE3=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/api/recruitment/lowisa-webhook" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "$PAYLOAD")

HTTP_CODE3=$(echo "$RESPONSE3" | tail -n 1)
BODY3=$(echo "$RESPONSE3" | head -n -1)

if [ "$HTTP_CODE3" = "200" ]; then
  echo -e "${GREEN}✅ Webhook working with X-API-Key${NC}"
  echo "Response: $(echo $BODY3 | cut -c1-150)..."
elif [ "$HTTP_CODE3" = "404" ]; then
  echo -e "${YELLOW}⚠️  Webhook endpoint not found - trying simple webhook${NC}"
  
  # Try the simple webhook endpoint
  RESPONSE4=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/api/recruitment/lowisa-webhook-simple" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d "$PAYLOAD")
  
  HTTP_CODE4=$(echo "$RESPONSE4" | tail -n 1)
  BODY4=$(echo "$RESPONSE4" | head -n -1)
  
  if [ "$HTTP_CODE4" = "200" ]; then
    echo -e "${GREEN}✅ Simple webhook working!${NC}"
    echo "Response: $(echo $BODY4 | cut -c1-150)..."
  else
    echo -e "${RED}❌ Simple webhook also failed (HTTP $HTTP_CODE4)${NC}"
  fi
else
  echo -e "${RED}❌ Webhook failed (HTTP $HTTP_CODE3)${NC}"
  echo "Response: $BODY3"
fi

echo ""
echo "3️⃣ Testing CORS Headers for GPT Integration"
echo "----------------------------------------"

# Test OPTIONS request for CORS preflight
echo "Testing CORS preflight..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$API_BASE_URL/api/recruitment/candidate-info" \
  -H "Origin: https://chat.openai.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-API-Key")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✅ CORS headers present${NC}"
  echo "$CORS_RESPONSE" | grep "Access-Control-"
else
  echo -e "${YELLOW}⚠️  CORS headers might need configuration${NC}"
  echo "This is required for ChatGPT to call your API"
fi

echo ""
echo "📊 Summary"
echo "========================================="

# Count successes
SUCCESS_COUNT=0
if [ "$HTTP_CODE1" = "200" ] || [ "$HTTP_CODE2" = "200" ]; then
  ((SUCCESS_COUNT++))
fi
if [ "$HTTP_CODE3" = "200" ] || [ "$HTTP_CODE4" = "200" ]; then
  ((SUCCESS_COUNT++))
fi

echo "Tests passed: $SUCCESS_COUNT/2"

if [ $SUCCESS_COUNT -eq 2 ]; then
  echo -e "${GREEN}✅ All endpoints working! Ready for GPT integration.${NC}"
elif [ $SUCCESS_COUNT -eq 1 ]; then
  echo -e "${YELLOW}⚠️  Partial success. Some configuration needed.${NC}"
else
  echo -e "${RED}❌ No endpoints accessible. Check your deployment.${NC}"
fi

echo ""
echo "🔍 Troubleshooting Tips:"
echo "------------------------"
if [ "$HTTP_CODE1" != "200" ] && [ "$HTTP_CODE2" != "200" ]; then
  echo "• Check if API is deployed to $API_BASE_URL"
  echo "• Verify API key authentication is configured"
  echo "• Ensure endpoints are publicly accessible"
fi

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  echo "• CORS is configured correctly"
else
  echo "• Add CORS headers for https://chat.openai.com"
  echo "• Required headers:"
  echo "  - Access-Control-Allow-Origin: https://chat.openai.com"
  echo "  - Access-Control-Allow-Methods: GET, POST, OPTIONS"
  echo "  - Access-Control-Allow-Headers: Content-Type, X-API-Key"
fi

echo ""
echo "🚀 Next Steps:"
echo "-------------"
echo "1. Update your Custom GPT with the working endpoint URLs"
echo "2. Use the authentication method that worked (X-API-Key or Bearer)"
echo "3. Test a complete conversation flow with the GPT"