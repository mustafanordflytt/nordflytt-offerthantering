#!/bin/bash

# Quick Deployment Script for api.nordflytt.se
# This script helps deploy the recruitment API endpoints to production

echo "🚀 Nordflytt API Quick Deployment Script"
echo "========================================"
echo ""

# Check if production environment file exists
if [ ! -f .env.production ]; then
    echo "⚠️  Warning: .env.production not found!"
    echo "Creating from example..."
    cp .env.production.example .env.production
    echo "✅ Created .env.production - Please update with your values"
    echo ""
fi

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install --production=false

# Step 3: Build for production
echo "🔨 Building for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors and try again."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Step 4: Test locally
echo "🧪 Would you like to test locally first? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Starting production server locally..."
    echo "Test these URLs:"
    echo "  http://localhost:3000/api/recruitment/candidate-info?id=1"
    echo "  http://localhost:3000/api/recruitment/lowisa-webhook-simple"
    echo ""
    echo "Press Ctrl+C to stop and continue deployment"
    npm start
fi

echo ""
echo "📋 Deployment Checklist:"
echo "========================"
echo ""
echo "For Vercel:"
echo "-----------"
echo "1. Run: vercel --prod"
echo "2. Add custom domain in Vercel dashboard"
echo ""
echo "For Traditional Server:"
echo "----------------------"
echo "1. Copy files to server:"
echo "   rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@server:/var/www/api.nordflytt.se/"
echo ""
echo "2. On server, run:"
echo "   cd /var/www/api.nordflytt.se"
echo "   npm install --production=false"
echo "   npm run build"
echo "   pm2 start npm --name 'nordflytt-api' -- start"
echo ""
echo "For Docker:"
echo "-----------"
echo "1. Build: docker build -t nordflytt-api ."
echo "2. Run: docker run -p 3000:3000 --env-file .env.production nordflytt-api"
echo ""
echo "🧪 After deployment, test with:"
echo "curl 'https://api.nordflytt.se/api/recruitment/candidate-info?id=1' \\"
echo "  -H 'Authorization: Bearer lowisa_nordflytt_2024_secretkey123'"
echo ""
echo "Good luck with your deployment! 🎉"