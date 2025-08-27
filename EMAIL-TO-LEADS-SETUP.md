# 📧 Email till Leads Integration - Setup Guide

## Översikt
Denna guide visar hur du kopplar inkommande email direkt till CRM Leads-modulen så att förfrågningar via email automatiskt blir leads.

## Arkitektur
```
Email → SendGrid Inbound Parse → Webhook → AI Parser → CRM Lead → Auto-reply
```

## Steg 1: SendGrid Inbound Parse Setup

### 1.1 Konfigurera DNS
Lägg till MX-record för en subdomän (t.ex. `parse.nordflytt.se`):
```
parse.nordflytt.se MX 10 mx.sendgrid.net
```

### 1.2 SendGrid Dashboard
1. Gå till Settings → Inbound Parse
2. Add Host & URL:
   - **Subdomain**: parse
   - **Domain**: nordflytt.se
   - **Destination URL**: https://din-app.se/api/webhooks/email-to-lead
   - **Spam Check**: ON
   - **Send Raw**: OFF

### 1.3 Email-adresser
Nu kan kunder skicka email till:
- leads@parse.nordflytt.se
- info@parse.nordflytt.se
- offert@parse.nordflytt.se

## Steg 2: Miljövariabler

Lägg till i `.env.local`:
```env
# OpenAI för intelligent email-parsing
OPENAI_API_KEY=sk-...

# SendGrid (redan konfigurerat)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=hej@nordflytt.se

# Webhook säkerhet (valfritt)
SENDGRID_WEBHOOK_VERIFICATION_KEY=...

# System token för intern API-kommunikation
SYSTEM_API_TOKEN=...
```

## Steg 3: Testa Integration

### 3.1 Lokal testning med ngrok
```bash
# Installera ngrok
brew install ngrok

# Exponera lokal server
ngrok http 3000

# Uppdatera SendGrid webhook till ngrok URL
# https://xxx.ngrok.io/api/webhooks/email-to-lead
```

### 3.2 Test-email
Skicka ett test-email till `leads@parse.nordflytt.se`:
```
Ämne: Flytthjälp Stockholm till Göteborg

Hej!

Jag behöver hjälp med flytt från Stockholm till Göteborg.

Från: Kungsgatan 10, Stockholm
Till: Avenyn 5, Göteborg
Datum: 15 mars 2025
Storlek: 3 rum och kök

Ring mig på 070-123 45 67

Mvh
Anna Andersson
```

### 3.3 Verifiera i CRM
1. Gå till CRM → Leads
2. Ny lead ska dyka upp med:
   - Status: "Nya Leads"
   - Källa: "Email"
   - Prioritet: "Hög"
   - Anteckningar med original email

## Steg 4: Anpassa AI-parsing

### 4.1 Förbättra extrahering
Redigera `analyzeEmailContent` i `/api/webhooks/email-to-lead/route.ts`:
```typescript
// Lägg till fler fält att extrahera
const prompt = `
...
- Packhjälp behövs: ja/nej
- Magasinering: ja/nej
- Pianoflytt: ja/nej
- RUT-avdrag önskas: ja/nej
`
```

### 4.2 Anpassa auto-svar
Redigera email-template baserat på extraherad data:
```typescript
if (analysis.moveDate) {
  html += `<p>Vi noterar att du vill flytta ${analysis.moveDate}.</p>`
}
if (analysis.pianoMove) {
  html += `<p>Vi är specialister på pianoflytt!</p>`
}
```

## Steg 5: Avancerade funktioner

### 5.1 Automatisk offertgenerering
Om tillräcklig data finns, generera offert direkt:
```typescript
if (analysis.fromAddress && analysis.toAddress && analysis.roomCount) {
  leadData.autoCreateOffer = true
}
```

### 5.2 Smart prioritering
```typescript
// Högre prioritet för vissa kriterier
if (analysis.moveDate && daysBetween(now, analysis.moveDate) < 14) {
  leadData.priority = 'urgent'
}
if (analysis.companyMove) {
  leadData.priority = 'high'
  leadData.estimatedValue = 50000 // Företagsflytt = högre värde
}
```

### 5.3 Duplicate detection
```typescript
// Kolla om lead redan finns
const existingLead = await checkExistingLead(fromEmail)
if (existingLead) {
  // Uppdatera befintlig lead istället
  await updateLead(existingLead.id, newData)
}
```

## Steg 6: Monitoring & Analytics

### 6.1 Logga alla inkommande emails
```typescript
await logEmailReceived({
  from: email.from,
  subject: email.subject,
  processed: analysis.isMovingRequest,
  leadCreated: !!createdLead
})
```

### 6.2 Dashboard metrics
- Antal emails mottagna
- Konverteringsgrad (email → lead)
- Genomsnittlig svarstid
- AI parsing accuracy

## Säkerhet

### 1. Webhook verification
```typescript
// Verifiera att request kommer från SendGrid
const signature = request.headers.get('x-twilio-email-event-webhook-signature')
const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp')
const isValid = verifyWebhookSignature(signature, timestamp, body)
```

### 2. Rate limiting
```typescript
// Begränsa antal requests per IP
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minut
  max: 10 // max 10 emails per minut
})
```

### 3. Spam filtering
- SendGrid spam check
- Ytterligare filter för uppenbara spam-patterns
- Blockera vissa domäner/IP

## Felsökning

### Problem: Emails kommer inte fram
1. Kontrollera MX-records: `dig MX parse.nordflytt.se`
2. Verifiera SendGrid Inbound Parse settings
3. Kolla SendGrid Activity Feed

### Problem: Leads skapas inte
1. Kontrollera API logs
2. Verifiera OpenAI API-nyckel
3. Testa med enklare email

### Problem: Auto-reply skickas inte
1. Kontrollera SendGrid API-nyckel
2. Verifiera from-email är verifierad i SendGrid
3. Kolla spam-folder

## Best Practices

1. **Alltid svara** - Även om det inte är en flyttförfrågan
2. **Snabb respons** - Auto-reply inom sekunder
3. **Personalisering** - Använd extraherad data i svaret
4. **Uppföljning** - Säljare kontaktar inom 24h
5. **Datakvalitet** - Flagga leads som behöver komplettering

## Nästa steg

1. Sätt upp produktions-webhook
2. Aktivera monitoring
3. Träna teamet på nya email-leads
4. A/B-testa auto-reply templates
5. Optimera AI-parsing baserat på verklig data