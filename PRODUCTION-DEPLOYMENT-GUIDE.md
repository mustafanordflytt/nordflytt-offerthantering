# 🚀 Production Deployment Guide for api.nordflytt.se

This guide will help you deploy your Next.js recruitment API endpoints to production.

## 📋 Pre-Deployment Checklist

### 1. Verify Local Endpoints Work
```bash
# Test locally first
curl "http://localhost:3000/api/recruitment/candidate-info?id=1" \
  -H "Authorization: Bearer lowisa_nordflytt_2024_secretkey123"
```

### 2. Environment Variables Needed
Create `.env.production` with:
```env
# API Keys
LOWISA_API_KEY=lowisa_nordflytt_2024_secretkey123

# App URLs
NEXT_PUBLIC_APP_URL=https://api.nordflytt.se
NEXTAUTH_URL=https://api.nordflytt.se

# Production Mode
NODE_ENV=production
```

## 🏗️ Build for Production

### Step 1: Install Dependencies
```bash
npm install --production=false
```

### Step 2: Build the Application
```bash
npm run build
```

### Step 3: Test Production Build Locally
```bash
npm start
# Test at http://localhost:3000
```

## 🌐 Deployment Options

### Option 1: Vercel (Easiest for Next.js)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy to Vercel**
```bash
vercel --prod
```

3. **Configure Custom Domain**
- Go to Vercel Dashboard
- Add custom domain: `api.nordflytt.se`
- Update DNS records as instructed

### Option 2: Traditional VPS/Server

1. **Prepare Server**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2
```

2. **Deploy Files**
```bash
# Copy files to server (adjust paths)
rsync -avz --exclude 'node_modules' --exclude '.next' \
  ./ user@your-server:/var/www/api.nordflytt.se/

# SSH into server
ssh user@your-server
cd /var/www/api.nordflytt.se
```

3. **Setup on Server**
```bash
# Install dependencies
npm install --production=false

# Build application
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'nordflytt-api',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

4. **Configure Nginx**
```nginx
# /etc/nginx/sites-available/api.nordflytt.se
server {
    server_name api.nordflytt.se;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

5. **Enable SSL with Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.nordflytt.se
```

### Option 3: Docker Deployment

1. **Create Dockerfile**
```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. **Build and Run**
```bash
# Build image
docker build -t nordflytt-api .

# Run container
docker run -p 3000:3000 \
  -e LOWISA_API_KEY=lowisa_nordflytt_2024_secretkey123 \
  -e NEXT_PUBLIC_APP_URL=https://api.nordflytt.se \
  nordflytt-api
```

### Option 4: Railway/Render (Platform as a Service)

1. **Railway.app**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

2. **Add environment variables in Railway dashboard**

## 🧪 Post-Deployment Testing

### 1. Test Each Endpoint
```bash
# Test candidate info
curl "https://api.nordflytt.se/api/recruitment/candidate-info?id=1" \
  -H "Authorization: Bearer lowisa_nordflytt_2024_secretkey123"

# Test webhook
curl -X POST "https://api.nordflytt.se/api/recruitment/lowisa-webhook-simple" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer lowisa_nordflytt_2024_secretkey123" \
  -d '{"applicationId": 1, "message": "Test", "sender": "candidate"}'

# Test conversation save
curl -X POST "https://api.nordflytt.se/api/recruitment/save-conversation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer lowisa_nordflytt_2024_secretkey123" \
  -d '{
    "application_id": 1,
    "message": "Test message",
    "sender": "lowisa"
  }'
```

### 2. Test CORS Headers
```bash
curl -I -X OPTIONS "https://api.nordflytt.se/api/recruitment/candidate-info" \
  -H "Origin: https://chat.openai.com" \
  -H "Access-Control-Request-Method: GET"
```

## 📊 Monitoring & Maintenance

### 1. Setup Logging
```bash
# View PM2 logs
pm2 logs nordflytt-api

# Setup log rotation
pm2 install pm2-logrotate
```

### 2. Monitor Performance
```bash
# PM2 monitoring
pm2 monit

# Check status
pm2 status
```

### 3. Setup Alerts
- Use services like UptimeRobot to monitor endpoints
- Configure alerts for downtime

## 🔧 Troubleshooting

### Common Issues:

1. **502 Bad Gateway**
   - Check if Node.js process is running
   - Verify PM2 status: `pm2 status`
   - Check logs: `pm2 logs`

2. **404 Not Found**
   - Verify Next.js routes are built
   - Check `.next` folder exists
   - Ensure nginx proxy_pass is correct

3. **CORS Errors**
   - Verify CORS headers in production
   - Check if origin is allowed

4. **Authentication Failures**
   - Verify LOWISA_API_KEY env variable
   - Check both auth header formats work

## 🎯 Final Verification

Your deployment is successful when:

✅ `https://api.nordflytt.se/api/recruitment/candidate-info?id=1` returns data
✅ GPT can call all endpoints without "connector" errors  
✅ CORS headers allow requests from `https://chat.openai.com`
✅ Both authentication methods work (X-API-Key and Bearer)

## 🚨 Quick Deployment Script

Save this as `deploy.sh` for quick deployments:

```bash
#!/bin/bash
echo "🚀 Deploying to Production..."

# Build
npm run build

# If using PM2
pm2 stop nordflytt-api
pm2 start ecosystem.config.js
pm2 save

echo "✅ Deployment complete!"
echo "🧪 Testing endpoints..."

# Test endpoint
curl -s "https://api.nordflytt.se/api/recruitment/candidate-info?id=1" \
  -H "Authorization: Bearer lowisa_nordflytt_2024_secretkey123" | head -c 100

echo ""
echo "🎉 Done!"
```

---

**Need help?** The endpoints are working locally - they just need to be accessible from the internet at `api.nordflytt.se`!