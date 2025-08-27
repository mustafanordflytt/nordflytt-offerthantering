# 🚀 Lowisa API Deployment Guide

## 🔴 Current Issue
The GPT is trying to call `api.nordflytt.se` but getting "Det gick inte att tala med connector" because the recruitment API endpoints are not deployed to production yet.

## 📝 What Needs to Be Deployed

### API Endpoints Required:
1. `/api/recruitment/candidate-info` - Get candidate information
2. `/api/recruitment/lowisa-webhook-simple` - Process chat messages  
3. `/api/recruitment/save-conversation` - Store conversation history

### Files to Deploy:
```
/app/api/recruitment/
├── candidate-info/route.ts
├── lowisa-webhook-simple/route.ts
├── save-conversation/route.ts
└── ... (other recruitment endpoints)

/lib/
├── api-auth-enhanced.ts  # Enhanced authentication
└── ... (other lib files)
```

## 🛠️ Deployment Steps

### 1. Build the Application
```bash
npm run build
```

### 2. Set Environment Variables
Create `.env.production` or set in your hosting platform:
```env
LOWISA_API_KEY=lowisa_nordflytt_2024_secretkey123
NEXT_PUBLIC_APP_URL=https://api.nordflytt.se
NODE_ENV=production
```

### 3. Deploy to Your Platform

#### Option A: Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option B: Traditional Server
```bash
# Build and start
npm run build
npm start
```

#### Option C: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 4. Configure Your Domain
Make sure `api.nordflytt.se` points to your deployment and the following routes are accessible:
- `https://api.nordflytt.se/api/recruitment/candidate-info`
- `https://api.nordflytt.se/api/recruitment/lowisa-webhook-simple`
- `https://api.nordflytt.se/api/recruitment/save-conversation`

## 🧪 Test Production Deployment

### Test Authentication Methods:
```bash
# Test with Bearer token (GPT format)
curl "https://api.nordflytt.se/api/recruitment/candidate-info?id=1" \
  -H "Authorization: Bearer lowisa_nordflytt_2024_secretkey123"

# Test with X-API-Key
curl "https://api.nordflytt.se/api/recruitment/candidate-info?id=1" \
  -H "X-API-Key: lowisa_nordflytt_2024_secretkey123"
```

### Expected Response:
```json
{
  "id": 1,
  "first_name": "Anna",
  "last_name": "Andersson",
  "email": "anna.andersson@email.com",
  ...
}
```

## 🤖 Update GPT Configuration

Once deployed, ensure your Custom GPT has:

### 1. Correct Base URL
```
https://api.nordflytt.se
```

### 2. Authentication Header
```
Authorization: Bearer lowisa_nordflytt_2024_secretkey123
```

### 3. Operations Configured:
- `getCandidateInfo`: GET `/api/recruitment/candidate-info`
- `saveConversation`: POST `/api/recruitment/save-conversation`
- `processMessage`: POST `/api/recruitment/lowisa-webhook-simple`

## 📊 Monitoring

After deployment, monitor:
1. **API Logs** - Check for 401/404 errors
2. **Response Times** - Ensure < 3s for GPT timeout
3. **Error Rates** - Track failed requests

## 🆘 Troubleshooting

### "Det gick inte att tala med connector"
- ✅ Check API is deployed and accessible
- ✅ Verify authentication is working
- ✅ Ensure CORS headers are present
- ✅ Check SSL certificate is valid

### 404 Errors
- ✅ Verify exact endpoint paths
- ✅ Check Next.js routing is working
- ✅ Ensure `/api/recruitment/` prefix is included

### 401 Unauthorized
- ✅ Check API key in environment variables
- ✅ Verify GPT is sending correct header format
- ✅ Test both auth methods work

## 🎯 Quick Fix for Testing

If you need to test immediately without full deployment:

1. **Use ngrok** for temporary public URL:
```bash
# Install ngrok
brew install ngrok

# Start your local server
npm run dev

# In another terminal, expose it
ngrok http 3000
```

2. **Update GPT** with ngrok URL temporarily:
```
https://abc123.ngrok.io/api/recruitment/...
```

## ✅ Success Criteria

Your deployment is successful when:
1. ✅ `curl https://api.nordflytt.se/api/recruitment/candidate-info?id=1` returns candidate data
2. ✅ GPT can call all three operations without errors
3. ✅ Conversations are being saved and retrieved
4. ✅ Swedish responses are returned from webhook

---

**Remember**: The APIs are working locally but need to be deployed to `api.nordflytt.se` for the GPT to access them!