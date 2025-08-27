# 🤖 AI Kundtjänst - Produktionskrav

## 📋 Nuvarande Status

### Vad som finns:
1. **Dashboard** (`/app/crm/ai-kundtjanst/page.tsx`)
   - Live chat-widget
   - Sessionsövervakning
   - Revenue tracking
   - Customer intelligence

2. **API Endpoints**:
   - `/api/ai-customer-service/health` - Hälsokontroll ✅
   - `/api/ai-customer-service/gpt/sessions` - GPT-sessioner
   - `/api/ai-customer-service/gpt/tickets` - Support tickets
   - `/api/ai-customer-service/gpt/chat` - Chat-funktionalitet
   - `/api/ai-customer-service/analytics` - Analytics & metrics

3. **Integration med Production API**:
   - URL: `https://api.nordflytt.se`
   - IP: `81.88.19.118`
   - API Key finns i `.env.development.local`

## 🚀 Vad som behövs för produktion:

### 1. **OpenAI API-integration**
```env
OPENAI_API_KEY=sk-proj-... # Finns redan i .env.development.local
```
- ✅ Nyckel finns redan konfigurerad
- ⚠️ Kontrollera att nyckeln är aktiv och har saldo

### 2. **Databastabeller i Supabase**
```sql
-- AI Customer Service Sessions
CREATE TABLE ai_customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) UNIQUE NOT NULL,
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_id UUID REFERENCES customers(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  messages_count INTEGER DEFAULT 0,
  revenue_potential DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  agent_name VARCHAR(100) DEFAULT 'Maja',
  conversation_topic TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  category VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  subject TEXT,
  description TEXT,
  gpt_session_id VARCHAR(100),
  assigned_to UUID REFERENCES crm_users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Events/Activities
CREATE TABLE ai_customer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) REFERENCES ai_customer_sessions(session_id),
  event_type VARCHAR(50) NOT NULL, -- customer_lookup, price_calculated, etc.
  event_data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_sessions_email ON ai_customer_sessions(customer_email);
CREATE INDEX idx_ai_sessions_status ON ai_customer_sessions(status);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_ai_events_session ON ai_customer_events(session_id);
```

### 3. **CORS-konfiguration**
För att kunna kommunicera med `https://api.nordflytt.se`:
- Lägg till din domän i CORS whitelist på produktions-API:et
- Eller använd en proxy i Next.js

### 4. **Real-time funktionalitet**
```typescript
// Supabase Realtime för live-uppdateringar
const subscription = supabase
  .channel('ai-customer-service')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'ai_customer_sessions'
  }, handleRealtimeUpdate)
  .subscribe()
```

### 5. **Miljövariabler som behövs**
```env
# AI & GPT
OPENAI_API_KEY=sk-proj-... ✅ (finns)
NORDFLYTT_GPT_API_KEY=nordflytt_gpt_api_key_2025 ✅ (finns)

# Production API
NEXT_PUBLIC_PRODUCTION_API_URL=https://api.nordflytt.se ✅ (finns)
USE_PRODUCTION_API=true ✅ (finns)

# Supabase (för att spara sessioner)
NEXT_PUBLIC_SUPABASE_URL=... ✅ (finns)
SUPABASE_SERVICE_ROLE_KEY=... ✅ (finns)
```

### 6. **Säkerhet & Authentication**
- JWT-validering för API-anrop
- Rate limiting för chat-funktioner
- Input sanitization för användarchatt
- GDPR-compliance för kunddata

## ✅ Checklista för produktionsklart:

- [ ] Skapa databastabeller i Supabase
- [ ] Aktivera RLS (Row Level Security) på tabellerna
- [ ] Testa OpenAI API-anslutning
- [ ] Konfigurera CORS för production API
- [ ] Sätt upp realtime-prenumerationer
- [ ] Implementera error handling & fallbacks
- [ ] Lägg till rate limiting
- [ ] Testa full flöde: Chat → Session → Ticket → Analytics

## 🔧 Test-kommando:
```bash
# Testa health endpoint
curl http://localhost:3002/api/ai-customer-service/health
```

## 📊 Förväntad funktionalitet:
1. **Maja AI-assistent** svarar på kundfrågor
2. **Automatisk kundidentifiering** via e-post
3. **Support-tickets** skapas automatiskt
4. **Prisberäkningar** i realtid
5. **Analytics & rapportering** av alla samtal
6. **Integration med CRM** för kundhistorik

---
**Status**: Nästan klar - behöver databastabeller
**Prioritet**: Hög
**Tidsuppskattning**: 2-3 timmar