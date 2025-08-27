# 🤖 GPT RAG API Documentation

## Overview
The Nordflytt GPT RAG (Retrieval-Augmented Generation) API provides real-time access to customer data, booking information, and business logic for Custom GPT integration. This enables AI-powered customer service with access to actual CRM data.

## 🔐 Authentication

All endpoints require Bearer token authentication:

```bash
Authorization: Bearer nordflytt_gpt_api_key_2025
```

## 📡 Base URL

```
Production: https://api.nordflytt.se/gpt-rag
Development: http://localhost:3000/api/gpt-rag
```

## 🚦 Rate Limiting

- **Limit**: 100 requests per 15 minutes
- **Headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- **429 Response**: When rate limit is exceeded

## 📋 Endpoints

### 1. Customer Lookup
**POST** `/customer-lookup`

Retrieves customer information and generates personalized greetings.

#### Request Body:
```json
{
  "email": "anna.svensson@gmail.com",
  "phone": "070-123 45 67",  // optional
  "query_context": "complaint about damaged item"  // optional
}
```

#### Response:
```json
{
  "customer_found": true,
  "customer_data": {
    "name": "Anna Svensson",
    "is_vip": false,
    "total_bookings": 3,
    "last_booking": {
      "date": "2024-12-15",
      "services": ["flytt", "packning"]
    },
    "is_returning": true
  },
  "response_context": "returning_customer",
  "suggested_greeting": "Hej Anna! Jag ser din senaste bokning från 15 december. Hur kan jag hjälpa dig?"
}
```

### 2. Booking Details
**POST** `/booking-details`

Fetches detailed information about a specific booking.

#### Request Body:
```json
{
  "customer_email": "anna.svensson@gmail.com",
  "booking_date": "2024-12-15",  // optional
  "booking_id": "BK-2024-001234"  // optional
}
```

#### Response:
```json
{
  "booking_found": true,
  "booking_data": {
    "booking_id": "12345678-1234-1234-1234-123456789012",
    "reference_number": "BK-2024-001234",
    "date": "2024-12-15",
    "services": ["flytt", "packning", "städning"],
    "total_amount": 8500,
    "status": "completed",
    "packed_by_nordflytt": true,
    "photos_available": true,
    "from_address": "Vasagatan 10, Stockholm",
    "to_address": "Östermalm 25, Stockholm",
    "volume_m3": 25
  },
  "service_context": {
    "has_packing_service": true,
    "has_cleaning": true,
    "has_boxes": false,
    "has_storage": false
  },
  "additional_info": {
    "can_modify": false,
    "can_cancel": false,
    "invoice_sent": true,
    "payment_status": "paid"
  }
}
```

### 3. Create Support Ticket
**POST** `/create-ticket`

Creates a support ticket in the CRM system.

#### Request Body:
```json
{
  "customer_email": "anna.svensson@gmail.com",
  "issue_type": "damage_claim",
  "description": "Customer reports damaged TV screen after move on 2024-12-15",
  "priority": "high",
  "booking_reference": "BK-2024-001234"
}
```

#### Issue Types:
- `damage_claim` - Skadeanmälan
- `booking_change` - Bokningsändring
- `complaint` - Klagomål
- `cleaning_issue` - Städningsproblem
- `general` - Allmän fråga

#### Priority Levels:
- `low` - inom 2 arbetsdagar
- `medium` - inom 24 timmar
- `high` - inom 2 timmar

#### Response:
```json
{
  "ticket_created": true,
  "ticket_data": {
    "ticket_id": "ticket-1234567890-abc123def",
    "ticket_number": "NF-2025-1234",
    "estimated_response": "inom 2 timmar",
    "assigned_team": "Claims Department"
  },
  "suggested_response": "Jag har skapat ärende NF-2025-1234 för din skadeanmälan. Du får email inom 2 timmar med mer information. Vår skadeavdelning kommer att kontakta dig med information om nästa steg, inklusive eventuell dokumentation som behövs."
}
```

### 4. Calculate Price
**POST** `/calculate-price`

Calculates dynamic pricing for moving services.

#### Request Body:
```json
{
  "volume_m3": 25,
  "floors_from": 4,
  "floors_to": 2,
  "elevator_from": "none",
  "elevator_to": "small",
  "additional_services": ["packing", "cleaning", "piano"],
  "distance_km": 50
}
```

#### Elevator Options:
- `yes` or `small` - Has elevator
- `none` - No elevator
- `broken` - Broken elevator

#### Additional Services:
- `packing` or `packning`
- `cleaning` or `städning`
- `piano`
- `storage` or `magasinering`

#### Response:
```json
{
  "price_calculated": true,
  "pricing_data": {
    "total_price": 12500,
    "volume_discount": "15% rabatt för 20-29 m³",
    "savings_explanation": "Du sparar 2,200 kr tack vare 15% rabatt för 20-29 m³ och 3,500 kr med RUT-avdrag"
  },
  "price_breakdown": {
    "personnel_cost": 2050,
    "truck_cost": 4450,
    "stairs_fee": 1000,
    "additional_services": [
      "Packning (3h): 750 kr",
      "Flyttstädning: 1200 kr",
      "Pianoflytt: 2500 kr"
    ],
    "subtotal": 11950,
    "discount_amount": 1794,
    "rut_savings": 3500
  },
  "suggested_response": "Din flytt kostar 12,500 kr inklusive allt med 15% rabatt för 20-29 m³. Detta inkluderar packning, flyttstädning, pianohantering. Du sparar 2,200 kr tack vare 15% rabatt för 20-29 m³ och 3,500 kr med RUT-avdrag. Priset är redan reducerat med RUT-avdrag där det är tillämpligt."
}
```

## 🧪 Testing

### Using cURL:
```bash
# Customer lookup
curl -X POST http://localhost:3000/api/gpt-rag/customer-lookup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nordflytt_gpt_api_key_2025" \
  -d '{"email": "anna.svensson@gmail.com"}'

# Price calculation
curl -X POST http://localhost:3000/api/gpt-rag/calculate-price \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nordflytt_gpt_api_key_2025" \
  -d '{"volume_m3": 15, "floors_from": 2, "floors_to": 3, "elevator_from": "yes", "elevator_to": "no", "additional_services": ["packing"], "distance_km": 20}'
```

### Using the test script:
```bash
node test-gpt-rag-api.js
```

## 📊 Analytics

All API calls are logged in the `gpt_analytics` table with:
- Endpoint called
- Success/failure status
- Response time
- Customer email (if applicable)
- Request/response data

Access analytics via the view:
```sql
SELECT * FROM gpt_api_metrics 
WHERE timestamp > NOW() - INTERVAL '24 hours';
```

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid API key)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## 🔧 Integration with Custom GPT

### 1. Configure in OpenAI:
```yaml
name: Nordflytt Customer Service
description: AI assistant for Nordflytt moving company
api:
  type: openapi
  url: https://api.nordflytt.se/gpt-rag/openapi.json
  auth:
    type: bearer
    token: ${NORDFLYTT_GPT_API_KEY}
```

### 2. Example Custom GPT Instructions:
```
You are a customer service representative for Nordflytt, a Swedish moving company.

When a customer contacts you:
1. First, look up their information using the customer-lookup endpoint
2. Use their name and personalize the conversation based on their history
3. If they ask about a booking, use booking-details to get specifics
4. For pricing questions, use calculate-price with their requirements
5. If they have issues or complaints, create a support ticket

Always speak Swedish unless the customer prefers English.
Emphasize RUT-avdrag benefits when discussing prices.
Be helpful, professional, and solution-oriented.
```

## 🚀 Production Deployment

1. **SSL/HTTPS**: Ensure all endpoints use HTTPS
2. **API Key**: Generate secure production API key
3. **Rate Limiting**: Configure Redis for distributed rate limiting
4. **Monitoring**: Set up alerts for error rates and response times
5. **Backup**: Regular backups of gpt_analytics and support_tickets

## 📈 Success Metrics

Monitor these KPIs:
- API uptime (target: 99.9%)
- Average response time (target: <500ms)
- Customer lookup success rate (target: >95%)
- Ticket creation success rate (target: 100%)
- Error rate (target: <1%)

## 🆘 Support

For implementation questions or issues:
- Check error logs in `gpt_analytics` table
- Review rate limit headers
- Ensure API key is valid
- Verify request body format

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-17  
**Status**: Ready for Production