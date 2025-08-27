# 🔑 Test Tokens för Nordflytt

## Utvecklingsmiljö Auth Tokens

Dessa tokens är genererade för test och utveckling. **ANVÄND INTE I PRODUKTION!**

### 👤 Admin Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtYWRtaW4iLCJlbWFpbCI6ImFkbWluQG5vcmRmbHl0dC5zZSIsInJvbGUiOiJhZG1pbiIsIm5hbWUiOiJUZXN0IEFkbWluIiwiaWF0IjoxNzU2Mjk4ODE1LCJleHAiOjE3NTg4OTA4MTV9.vtbkRbvA5FSQWYrmStzRwLfXKcy4TFlJaVszU_Q4o3c
```
- Email: admin@nordflytt.se
- Role: admin
- Expires: 30 days

### 🔧 Staff Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3Qtc3RhZmYiLCJlbWFpbCI6InN0YWZmQG5vcmRmbHl0dC5zZSIsInBob25lIjoiKzQ2NzAxMjM0NTY3Iiwicm9sZSI6InN0YWZmIiwibmFtZSI6IlRlc3QgU3RhZmYiLCJpYXQiOjE3NTYyOTg4MTUsImV4cCI6MTc1ODg5MDgxNX0.E-BlrCklNyON1xDUFbmrln5C9o6hCFDvr5s9hX159DM
```
- Email: staff@nordflytt.se
- Phone: +46701234567
- Role: staff
- Expires: 30 days

### 🛒 Customer Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtY3VzdG9tZXIiLCJlbWFpbCI6ImN1c3RvbWVyQGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwibmFtZSI6IlRlc3QgQ3VzdG9tZXIiLCJpYXQiOjE3NTYyOTg4MTUsImV4cCI6MTc1ODg5MDgxNX0.z-ByAkRNdk0anxAwdwWJq7vD7R6B2c6qNO8K9aWlueA
```
- Email: customer@example.com
- Role: customer
- Expires: 30 days

## 🚀 Användningsexempel

### Curl
```bash
# Med Bearer token
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/customers

# Med API key
curl -H "x-api-key: test-api-key" http://localhost:3001/api/staff/jobs
```

### JavaScript/Fetch
```javascript
// Med Bearer token
const response = await fetch('http://localhost:3001/api/customers', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Med API key
const response = await fetch('http://localhost:3001/api/staff/jobs', {
  headers: {
    'x-api-key': 'test-api-key',
    'Content-Type': 'application/json'
  }
});
```

### TestSprite
För TestSprite, lägg till i test-konfigurationen:
```javascript
const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};
```

## 🔒 Publika Endpoints (ingen auth krävs)

Dessa endpoints är publika och kräver ingen autentisering:
- `/api/auth/send-otp`
- `/api/auth/verify-otp`
- `/api/submit-booking`
- `/api/confirm-booking`
- `/api/offers` (GET)
- `/api/health`
- `/api/test-simple`

## ⚙️ Generera nya tokens

Kör följande kommando för att generera nya tokens:
```bash
node scripts/generate-test-tokens.cjs
```

## 📝 Anteckningar

- AUTH_BYPASS=true är aktiverat i .env.local för utvecklingsmiljö
- Tokens gäller i 30 dagar
- JWT_SECRET finns i .env.local
- Alla tokens använder HS256 algoritm

---

Senast uppdaterad: 2025-01-27