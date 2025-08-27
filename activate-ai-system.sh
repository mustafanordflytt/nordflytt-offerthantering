#!/bin/bash

echo "🚀 NORDFLYTT AI SYSTEM ACTIVATION"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found!${NC}"
    echo "Please create .env.local with your API keys"
    exit 1
fi

echo "📋 Phase 1: Environment Check"
echo "----------------------------"

# Check for required environment variables
required_vars=("AI_SERVICE_TOKEN" "AI_SERVICE_API_URL" "NORDFLYTT_GPT_API_KEY" "NEXT_PUBLIC_SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if grep -q "^${var}=" .env.local && ! grep -q "^${var}=.*example.*" .env.local; then
        echo -e "${GREEN}✅ ${var} is configured${NC}"
    else
        echo -e "${RED}❌ ${var} is missing or uses example value${NC}"
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Please configure the following in .env.local:${NC}"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Need help? Check the documentation or use placeholder values for testing."
    exit 1
fi

echo ""
echo "📋 Phase 2: Database Setup"
echo "------------------------"

# Run database migrations
echo "Running AI system migrations..."
node run-ai-migrations.js

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database migrations failed${NC}"
    echo "Please check your Supabase connection and try again"
    exit 1
fi

echo ""
echo "📋 Phase 3: Build & Start"
echo "------------------------"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the application
echo "Building application with AI features..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ AI SYSTEM ACTIVATED SUCCESSFULLY!${NC}"
echo ""
echo "🎯 Next Steps:"
echo "1. Start the server: npm run dev"
echo "2. Visit http://localhost:3000/crm/dashboard"
echo "3. Look for:"
echo "   - 🤖 AI Performance Dashboard"
echo "   - 🎯 AI Lead Scoring"
echo "   - 🧠 Customer Intelligence panels"
echo "   - 🚀 AI Nytt Uppdrag button"
echo ""
echo "📊 AI Features Now Active:"
echo "- 92% Process Automation"
echo "- Real-time Lead Scoring"
echo "- Dynamic Pricing"
echo "- Smart Job Scheduling"
echo "- Customer Intelligence"
echo "- Performance Analytics"
echo ""
echo "Happy AI-powered moving! 🚚✨"