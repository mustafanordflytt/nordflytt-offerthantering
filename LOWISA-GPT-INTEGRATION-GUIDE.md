# 🚀 Lowisa GPT Integration Guide - Complete Setup

## 🎯 Overview
This guide connects your configured Lowisa GPT assistant with the implemented API endpoints. All endpoints are already created and ready for integration!

## ✅ What's Already Implemented

### API Endpoints (All Ready!)
1. **POST** `/api/recruitment/lowisa-webhook` - Process messages and generate responses
2. **GET** `/api/recruitment/candidate-info` - Retrieve candidate information
3. **PATCH** `/api/recruitment/candidate-info` - Update candidate stage
4. **POST** `/api/recruitment/save-conversation` - Store conversations
5. **GET** `/api/recruitment/conversations/[id]` - Get conversation history

### UI Components (Ready to Use!)
1. **LowisaChatModal** - Real-time chat interface
2. **LowisaAssistant** - GPT-4 integration library
3. **Recruitment Dashboard** - Integrated with chat buttons

## 🔧 Step 1: Environment Configuration

Add these variables to your `.env.local`:

```bash
# Lowisa API Key (matches GPT configuration)
LOWISA_API_KEY=lowisa_nordflytt_2024_secretkey123

# Your app URL for API calls
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenAI API Key (for Lowisa responses - optional)
OPENAI_API_KEY=your-openai-api-key
```

## 🛡️ Step 2: Add API Key Authentication

Create middleware for API authentication:

```typescript
// lib/api-auth.ts
import { NextRequest, NextResponse } from 'next/server';

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123';
  
  return apiKey === validApiKey;
}
```

Update your API endpoints to use authentication:

```typescript
// In each API route, add at the beginning:
import { validateApiKey } from '@/lib/api-auth';

export async function POST(request: Request) {
  // Validate API key
  if (!validateApiKey(request as NextRequest)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Continue with endpoint logic...
}
```

## 🧪 Step 3: Test the Integration

### A. Test Individual Endpoints
Run the test script:
```bash
node test-lowisa-api-endpoints.js
```

### B. Test GPT Integration
1. Open your Custom GPT in ChatGPT
2. Start a conversation: "Hej! Jag vill ansöka om jobb hos Nordflytt"
3. Verify the GPT calls your webhook endpoint
4. Check that conversations are saved in your database

### C. Test UI Integration
1. Go to recruitment dashboard: `http://localhost:3000/crm/rekrytering`
2. Click "Ansökningar" tab
3. Find candidates in "email_screening" stage
4. Click the chat icon (MessageSquare)
5. Test the Lowisa chat interface

## 📊 Step 4: Monitor & Debug

### Check API Logs
```javascript
// Add logging to your webhook endpoint
console.log('[Lowisa Webhook] Received:', {
  applicationId: body.applicationId,
  sender: body.sender,
  messagePreview: body.message.substring(0, 50) + '...'
});
```

### Monitor Completeness
```javascript
// Log when information is complete
if (completeness.isComplete) {
  console.log('[Lowisa] Information complete for application:', applicationId);
  console.log('Areas collected:', Object.keys(completeness.details).filter(k => completeness.details[k]));
}
```

## 🎯 Step 5: Production Deployment

### 1. Update Base URL in GPT Configuration
Change the server URL in your Custom GPT:
```json
{
  "servers": [
    {
      "url": "https://your-production-domain.com/api/recruitment"
    }
  ]
}
```

### 2. Set Production Environment Variables
```bash
# Production .env
LOWISA_API_KEY=your-secure-production-key
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### 3. Enable CORS for GPT
Add to your API routes:
```typescript
// Set CORS headers for OpenAI
const headers = {
  'Access-Control-Allow-Origin': 'https://chat.openai.com',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};
```

## 🔄 Integration Flow

```mermaid
graph TD
    A[Candidate] -->|Chats| B[Lowisa GPT]
    B -->|API Call| C[/lowisa-webhook]
    C -->|Save| D[Database]
    C -->|Analyze| E[Completeness Check]
    E -->|If Complete| F[Update Stage]
    E -->|Response| B
    B -->|Reply| A
    F -->|Send| G[Typeform Link]
```

## 📱 Mobile Integration

The system works on mobile devices:
1. Candidates can chat with Lowisa via mobile web
2. Recruiters can monitor conversations on mobile dashboard
3. All UI components are mobile-responsive

## 🎉 Success Checklist

- [ ] Environment variables configured
- [ ] API key authentication added
- [ ] Test script runs successfully
- [ ] GPT can call your webhook
- [ ] Conversations are saved to database
- [ ] Information completeness tracking works
- [ ] Automatic stage updates work
- [ ] UI chat modal functions correctly
- [ ] Mobile experience tested

## 🚨 Troubleshooting

### GPT Not Calling API
1. Check API key in GPT configuration matches your `.env`
2. Verify server URL is correct
3. Test with curl command:
```bash
curl -X POST http://localhost:3000/api/recruitment/lowisa-webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lowisa_nordflytt_2024_secretkey123" \
  -d '{"applicationId": 1, "message": "Test", "sender": "candidate"}'
```

### Conversations Not Saving
1. Check database connection
2. Verify conversation table exists
3. Check API response for errors

### Completeness Not Detecting
1. Review keyword patterns in regex
2. Check Swedish language variations
3. Test with exact keywords first

## 🎯 Next Steps

1. **Deploy to staging** - Test with real candidates
2. **Monitor metrics** - Track completion rates
3. **Optimize prompts** - Improve based on real conversations
4. **Add analytics** - Track engagement and success rates
5. **Scale globally** - Add multi-language support

## 🏆 You're Ready!

Your Lowisa GPT integration is complete and ready to revolutionize recruitment at Nordflytt! The system will:

✅ Automatically screen candidates in Swedish
✅ Gather required information systematically
✅ Track completeness in real-time
✅ Update recruitment stages automatically
✅ Send Typeform links when ready
✅ Save all conversations for analysis

**Start using Lowisa today and watch your recruitment efficiency soar! 🚀**