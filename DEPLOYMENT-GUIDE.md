# 🚀 Nordflytt Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Security Keys ✅
```bash
# Generate all security keys
./scripts/generate-security-keys.sh

# This creates .env.production with:
# - JWT_SECRET
# - INTERNAL_API_KEY
# - ENCRYPTION_KEY
# - PARTNER_API_KEY
# - MOBILE_APP_KEY
# - PERSONAL_NUMBER_SALT
```

### 2. Environment Variables 🔐
Ensure all these are configured in your deployment platform:

#### Required Variables
```env
# Database
DATABASE_URL=your-production-database-url
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security (from generate-security-keys.sh)
JWT_SECRET=generated-secret
INTERNAL_API_KEY=generated-key
ENCRYPTION_KEY=generated-key

# External Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+46xxxxxxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=https://nordflytt.se
NODE_ENV=production
```

### 3. Database Setup 🗄️
```sql
-- Run migrations in Supabase SQL editor
-- Check /migrations folder for all SQL files
```

### 4. Domain Configuration 🌐
- Primary: nordflytt.se
- Staging: staging.nordflytt.se
- Admin: admin.nordflytt.se
- App: app.nordflytt.se

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add DATABASE_URL production
# ... add all other variables
```

### Option 2: Docker + VPS
```bash
# Build Docker image
docker build -t nordflytt:latest .

# Run with env file
docker run -d \
  --name nordflytt \
  --env-file .env.production \
  -p 80:3000 \
  nordflytt:latest
```

### Option 3: Traditional VPS
```bash
# On server
git clone https://github.com/your-org/nordflytt.git
cd nordflytt
npm install --production
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "nordflytt" -- start
pm2 save
pm2 startup
```

## 📊 Post-Deployment Verification

### 1. Health Checks
```bash
# API Health
curl https://nordflytt.se/api/health

# Service Worker
curl https://nordflytt.se/service-worker.js

# Manifest
curl https://nordflytt.se/manifest.json
```

### 2. Security Verification
```bash
# Check security headers
curl -I https://nordflytt.se

# Run security audit
node security-tests/security-audit.js
```

### 3. Performance Testing
```bash
# Run Lighthouse
npx lighthouse https://nordflytt.se --output html

# Load test
k6 run load-tests/booking-load-test.js
```

### 4. Functionality Testing
- [ ] Complete booking flow
- [ ] Verify SMS/Email notifications
- [ ] Test staff login and dashboard
- [ ] Check photo upload
- [ ] Verify offline functionality
- [ ] Test real-time updates

## 🔒 Security Hardening

### 1. Firewall Rules
```bash
# Allow only necessary ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### 2. SSL/TLS Configuration
```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
```

### 3. Rate Limiting
Already configured in middleware, but ensure Redis is set up for production:
```bash
# Install Redis
apt-get install redis-server
systemctl enable redis-server
```

## 📈 Monitoring Setup

### 1. Application Monitoring
- Sentry for error tracking
- Google Analytics for user behavior
- Custom metrics endpoint

### 2. Infrastructure Monitoring
- Uptime monitoring (e.g., UptimeRobot)
- Server metrics (CPU, Memory, Disk)
- Database performance

### 3. Alerts Configuration
```javascript
// Example Sentry configuration
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: 'production',
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 0.1,
});
```

## 🔄 Rollback Plan

### Quick Rollback
```bash
# Vercel
vercel rollback

# Docker
docker stop nordflytt
docker run -d --name nordflytt nordflytt:previous-version

# PM2
pm2 reload nordflytt --update-env
```

### Database Rollback
Always backup before migrations:
```sql
-- Create backup
pg_dump production_db > backup_$(date +%Y%m%d).sql

-- Restore if needed
psql production_db < backup_20240128.sql
```

## 📞 Support Contacts

- **Technical Issues**: tech@nordflytt.se
- **Security Issues**: security@nordflytt.se
- **On-Call**: +46 XX XXX XX XX

## 🎯 Launch Checklist

- [ ] All environment variables set
- [ ] Security keys generated and stored
- [ ] Database migrations completed
- [ ] SSL certificate active
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Team notified
- [ ] Documentation updated
- [ ] Customer support briefed

---

**Last Updated**: 2025-01-28
**Version**: 1.0.0
**Status**: Ready for Production 🚀