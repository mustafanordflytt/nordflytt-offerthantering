# 🤖 Lowisa API Documentation

## Overview
The Lowisa API enables integration with Nordflytt's AI-powered recruitment assistant. These endpoints handle candidate conversations, information gathering, and automated screening processes.

## Base URL
```
Production: https://your-domain.com/api/recruitment
Development: http://localhost:3000/api/recruitment
```

## Authentication
Currently using API keys in headers (to be implemented):
```
X-API-Key: your-api-key-here
```

## Endpoints

### 1. Lowisa Webhook
Process incoming messages from candidates and generate AI responses.

**Endpoint:** `POST /lowisa-webhook`

**Request Body:**
```json
{
  "applicationId": 1,
  "message": "Jag har B-körkort och 2 års erfarenhet",
  "sender": "candidate",
  "timestamp": "2024-01-16T10:30:00Z",
  "metadata": {
    "source": "web",
    "sessionId": "session-123",
    "platform": "desktop"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Perfekt! B-körkort är bra att ha...",
  "completeness": {
    "isComplete": false,
    "completedAreas": 2,
    "totalAreas": 4,
    "completionRate": 50,
    "missing": ["tillgänglighet", "svenska"],
    "details": {
      "körkort": true,
      "arbetserfarenhet": true,
      "tillgänglighet": false,
      "svenska": false
    }
  },
  "applicationId": 1,
  "timestamp": "2024-01-16T10:30:15Z"
}
```

**Status Codes:**
- `200 OK` - Message processed successfully
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Processing error

---

### 2. Get Candidate Information
Retrieve candidate details by ID or email.

**Endpoint:** `GET /candidate-info`

**Query Parameters:**
- `id` (optional) - Candidate ID
- `email` (optional) - Candidate email
- `stage` (optional) - Filter by recruitment stage
- `position` (optional) - Filter by desired position

**Examples:**
```
GET /candidate-info?id=1
GET /candidate-info?email=anna.andersson@email.com
GET /candidate-info?stage=email_screening
GET /candidate-info?position=flyttpersonal
```

**Response (single candidate):**
```json
{
  "id": 1,
  "first_name": "Anna",
  "last_name": "Andersson",
  "email": "anna.andersson@email.com",
  "phone": "+46701234567",
  "desired_position": "flyttpersonal",
  "current_stage": "email_screening",
  "overall_score": 0.75,
  "status": "active",
  "application_date": "2024-01-15T10:30:00Z",
  "location": "Stockholm",
  "has_drivers_license": true,
  "license_type": "B",
  "languages": ["Svenska", "Engelska"],
  "previous_experience": {
    "moving": true,
    "cleaning": false,
    "warehouse": true,
    "restaurant": false,
    "construction": false
  }
}
```

**Response (all candidates):**
```json
{
  "candidates": [...],
  "total": 25,
  "timestamp": "2024-01-16T10:30:00Z"
}
```

---

### 3. Update Candidate Information
Update candidate details and stage.

**Endpoint:** `PATCH /candidate-info?id={candidateId}`

**Request Body:**
```json
{
  "current_stage": "personality_test",
  "overall_score": 0.85,
  "notes": "Excellent communication skills"
}
```

**Response:**
```json
{
  "success": true,
  "candidate": { /* updated candidate object */ },
  "message": "Candidate information updated successfully"
}
```

---

### 4. Save Conversation
Store conversation messages between candidates and Lowisa.

**Endpoint:** `POST /save-conversation`

**Request Body:**
```json
{
  "application_id": 1,
  "message": "Hej! Jag är intresserad av jobbet.",
  "sender": "candidate",
  "timestamp": "2024-01-16T10:30:00Z",
  "metadata": {
    "source": "web",
    "sessionId": "session-123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "conv-123456",
    "application_id": 1,
    "message": "Hej! Jag är intresserad av jobbet.",
    "sender": "candidate",
    "timestamp": "2024-01-16T10:30:00Z"
  },
  "analysis": {
    "sentiment": "positive",
    "hasUrgentQuestion": false,
    "messageCount": 5,
    "responseRate": 100,
    "averageResponseTime": 30
  }
}
```

---

### 5. Get Conversation History
Retrieve all conversations for a specific application.

**Endpoint:** `GET /conversations/{applicationId}`

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-1",
      "application_id": 1,
      "sender": "lowisa",
      "message": "Hej Anna! Välkommen till Nordflytt...",
      "timestamp": "2024-01-16T10:00:00Z"
    },
    {
      "id": "conv-2",
      "application_id": 1,
      "sender": "candidate",
      "message": "Hej Lowisa! Ja absolut, det går bra.",
      "timestamp": "2024-01-16T10:05:00Z"
    }
  ],
  "stats": {
    "totalMessages": 10,
    "candidateMessages": 5,
    "lowisaMessages": 5,
    "lastMessageTime": "2024-01-16T10:30:00Z",
    "conversationStarted": "2024-01-16T10:00:00Z"
  },
  "application_id": 1
}
```

---

## Information Completeness Check

The system tracks four key areas of information:

1. **Körkort (Driver's License)**
   - Keywords: körkort, b-körkort, c-körkort, ce-körkort, licens
   - Required: Type of license (B, C, CE, etc.)

2. **Arbetserfarenhet (Work Experience)**
   - Keywords: arbete, jobb, erfarenhet, flytt, städ, lager, restaurang, bygg
   - Required: Years of experience and relevant industries

3. **Tillgänglighet (Availability)**
   - Keywords: tid, dagar, vecka, flexibel, tillgänglig, måndag-söndag
   - Required: Available days and flexibility for extra shifts

4. **Svenska (Swedish Language)**
   - Keywords: svenska, språk, pratar, förstår, flytande
   - Required: Level of Swedish proficiency

When all four areas are complete, the system automatically:
- Updates candidate stage to `typeform_sent`
- Sends Typeform link to candidate
- Notifies the recruitment team

## Webhook Integration Example

```javascript
// Example webhook handler
app.post('/lowisa-webhook', async (req, res) => {
  const { applicationId, message, sender } = req.body;
  
  // Process with Lowisa API
  const response = await fetch('https://your-domain.com/api/recruitment/lowisa-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.LOWISA_API_KEY
    },
    body: JSON.stringify({
      applicationId,
      message,
      sender,
      timestamp: new Date().toISOString()
    })
  });
  
  const data = await response.json();
  
  // Handle response
  if (data.completeness.isComplete) {
    console.log('Information gathering complete!');
  }
  
  res.json(data);
});
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "timestamp": "2024-01-16T10:30:00Z"
}
```

## Rate Limiting

- 100 requests per minute per API key
- 1000 requests per hour per API key
- Webhook endpoints: 10 requests per second

## Best Practices

1. **Always include timestamps** in webhook messages for accurate conversation tracking
2. **Handle webhook retries** - Implement idempotency to avoid duplicate processing
3. **Monitor completeness** - Check the completeness object to track information gathering progress
4. **Use metadata** - Include session IDs and source information for better tracking
5. **Implement error handling** - Always handle 4xx and 5xx responses gracefully

## Testing

Use the provided test script to verify your integration:
```bash
node test-lowisa-api-endpoints.js
```

## Support

For API support and questions:
- Email: api-support@nordflytt.se
- Documentation: https://docs.nordflytt.se/api/lowisa
- Status page: https://status.nordflytt.se