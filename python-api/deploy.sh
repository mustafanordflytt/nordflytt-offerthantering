#!/bin/bash
# Production deployment script for Nordflytt GPT RAG API

set -e  # Exit on error

echo "🚀 Nordflytt GPT RAG API Production Deployment"
echo "=============================================="

# Check if running as root (recommended for server)
if [[ $EUID -ne 0 ]]; then
   echo "⚠️  This script should be run as root for production deployment"
   echo "   Use: sudo ./deploy.sh"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Check prerequisites
echo ""
echo "1️⃣  Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ All prerequisites installed"

# 2. Check environment file
echo ""
echo "2️⃣  Checking environment configuration..."

if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "   Please create it from .env.example and add production values"
    exit 1
fi

# Check for required environment variables
if ! grep -q "SUPABASE_SERVICE_ROLE_KEY=YOUR_PRODUCTION" .env.production; then
    echo "✅ Production environment file seems configured"
else
    echo "⚠️  WARNING: .env.production still contains placeholder values!"
    echo "   Please update with real production credentials before continuing."
    read -p "   Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 3. SSL Certificate setup
echo ""
echo "3️⃣  SSL Certificate Setup..."
echo "   Choose an option:"
echo "   1) I already have SSL certificates"
echo "   2) Generate new Let's Encrypt certificates"
echo "   3) Skip SSL (development only)"

read -p "Your choice (1-3): " ssl_choice

case $ssl_choice in
    1)
        echo "   Please ensure certificates are in /etc/letsencrypt/live/api.nordflytt.se/"
        ;;
    2)
        echo "   Installing Certbot and generating certificates..."
        if ! command_exists certbot; then
            apt-get update
            apt-get install -y certbot
        fi
        
        # Stop any running services on port 80
        docker-compose down 2>/dev/null || true
        
        # Generate certificate
        certbot certonly --standalone -d api.nordflytt.se \
            --non-interactive --agree-tos \
            --email admin@nordflytt.se \
            --rsa-key-size 4096
        
        echo "✅ SSL certificates generated"
        ;;
    3)
        echo "⚠️  WARNING: Skipping SSL is not recommended for production!"
        ;;
esac

# 4. Build and deploy
echo ""
echo "4️⃣  Building and deploying services..."

# Use production Dockerfile
cp Dockerfile.production Dockerfile

# Build services
docker-compose build --no-cache

# Stop existing services
docker-compose down

# Start services
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "5️⃣  Waiting for services to be healthy..."
sleep 10

# Check health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ API server is healthy"
else
    echo "❌ API server health check failed"
    echo "   Check logs with: docker-compose logs gpt-api"
    exit 1
fi

# 5. Run database migrations
echo ""
echo "6️⃣  Database migrations..."
echo "   Please run these SQL files in your Supabase dashboard:"
echo "   - migrations/001_create_support_tickets.sql"
echo "   - migrations/002_create_gpt_analytics.sql"
echo "   - migrations/003_update_existing_tables.sql"
echo ""
read -p "   Have you run the migrations? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Please run migrations before using the API"
fi

# 6. Setup monitoring (optional)
echo ""
echo "7️⃣  Monitoring setup (optional)..."
echo "   Recommended monitoring tools:"
echo "   - Set up Datadog or New Relic for APM"
echo "   - Configure CloudWatch for logs"
echo "   - Set up alerts for API errors"
echo "   - Monitor rate limiting and response times"

# 7. Firewall configuration
echo ""
echo "8️⃣  Firewall configuration..."
if command_exists ufw; then
    echo "   Configuring UFW firewall..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "✅ Firewall configured"
else
    echo "   Please configure your firewall to allow ports 80 and 443"
fi

# 8. Final checks
echo ""
echo "9️⃣  Running final checks..."

# Test endpoints
echo "   Testing API endpoints..."
API_KEY=$(grep NORDFLYTT_GPT_API_KEY .env.production | cut -d '=' -f2)

# Test health endpoint
if curl -s https://api.nordflytt.se/health | grep -q "healthy"; then
    echo "   ✅ Health endpoint working over HTTPS"
else
    echo "   ⚠️  HTTPS health check failed (this is normal if DNS not configured yet)"
fi

# Show status
echo ""
echo "📊 Deployment Status:"
docker-compose ps

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "📝 Next steps:"
echo "1. Update DNS to point api.nordflytt.se to this server"
echo "2. Test all endpoints using test_api.py"
echo "3. Update Custom GPT with production URL and API key"
echo "4. Monitor logs: docker-compose logs -f"
echo ""
echo "🔗 API Endpoints:"
echo "   Base URL: https://api.nordflytt.se"
echo "   Documentation: https://api.nordflytt.se/docs"
echo "   Health check: https://api.nordflytt.se/health"
echo ""
echo "🔑 API Key for Custom GPT:"
echo "   $API_KEY"
echo ""
echo "⚡ The API is now live and ready for Custom GPT integration!"