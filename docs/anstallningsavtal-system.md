# 📄 Anställningsavtal-system för Nordflytt CRM

## 📋 Översikt

Detta system lägger till komplett anställningsavtal-funktionalitet till det befintliga Nordflytt CRM:et som ett smidigt tillägg utan att påverka befintlig kod.

### ✨ Funktioner

- **PDF-generering** med Puppeteer från HTML-templates
- **Digital signering** med säker token-baserad autentisering  
- **Email-distribution** av avtal (mock-implementation)
- **Rollspecifika avtalsmallar** med kvalitetskrav
- **Statushantering** (Utkast → Skickat → Signerat)
- **Integration** med befintlig personal-modul
- **Fallback-databas** för demo-drift

## 🏗️ Arkitektur

### Filstruktur
```
/data/
  contracts.json                    # Fallback-databas
/templates/
  contract-template.html            # Puppeteer HTML-mall
/app/api/contracts/
  generate/route.ts                 # PDF-generering
  send/route.ts                     # Email-distribution
  [token]/route.ts                  # Hämta avtal för signering
  sign/route.ts                     # Behandla signering
/app/avtal/
  signera/[token]/page.tsx          # Signeringsportal
  bekraftelse/page.tsx              # Bekräftelsesida
/components/contracts/
  ContractGenerator.tsx             # Generera avtal
  ContractStatus.tsx                # Visa avtalsstatus
/public/contracts/                  # PDF-lagring
```

### Tech Stack

- **PDF-generering**: Puppeteer (HTML → PDF)
- **Databas**: Fallback JSON-fil (kan ersättas med Supabase)
- **Email**: Mock-implementation (kan ersättas med SendGrid/Nodemailer)
- **Autentisering**: Token-baserad signering
- **UI**: shadcn/ui komponenter

## 🚀 Installation & Setup

### 1. Förutsättningar
```bash
# Puppeteer finns redan installerat i package.json
npm install  # eller om det behövs: npm install puppeteer
```

### 2. Starta systemet
```bash
npm run dev
# CRM tillgängligt på localhost:3000/crm/anstallda/
```

### 3. Testa funktionaliteten
1. Gå till `/crm/anstallda/staff-001` (befintlig testanställd)
2. Klicka på "Avtal"-tab
3. Klicka "Generera Anställningsavtal"
4. Välj rolltyp och generera PDF
5. Skicka avtal och testa signeringsprocessen

## 📊 API Endpoints

### POST `/api/contracts/generate`
**Genererar PDF-avtal från HTML-template**
```typescript
// Request
{
  "employeeId": "staff-001",
  "contractType": "flyttledare"
}

// Response
{
  "success": true,
  "contractId": "contract-123",
  "pdfUrl": "/contracts/lars-andersson-flyttledare-123.pdf",
  "signingToken": "abc123..."
}
```

### POST `/api/contracts/send`
**Skickar avtal för signering via email**
```typescript
// Request
{
  "employeeId": "staff-001", 
  "contractId": "contract-123"
}

// Response
{
  "success": true,
  "signingUrl": "localhost:3000/avtal/signera/abc123...",
  "expiryDate": "2024-02-15T12:00:00Z"
}
```

### GET `/api/contracts/[token]`
**Hämtar avtalsdata för signering**
```typescript
// Response
{
  "contract": { "id": "...", "type": "flyttledare", ... },
  "employee": { "name": "Lars", "email": "...", ... },
  "template": { "hourlyRate": "185", "qualityRequirements": [...] },
  "companyInfo": { "name": "Flyttverket Sverige AB", ... }
}
```

### POST `/api/contracts/sign`
**Behandlar digital signering**
```typescript
// Request
{
  "signingToken": "abc123...",
  "signature": "Lars Andersson",
  "clearingNumber": "1234",
  "accountNumber": "1234567890",
  "clothingSize": "L"
}

// Response
{
  "success": true,
  "contractId": "contract-123",
  "signedDate": "2024-01-15T12:00:00Z"
}
```

## 🎯 Rollspecifika Avtalsmallar

### 1. Flyttpersonal (130-165 kr/h)
```typescript
qualityRequirements: [
  "GPS-incheckning vid varje uppdrag",
  "Fotodokumentation av skador", 
  "Materialförsäljning enligt prislistor",
  "Fordonsdokumentation och rapportering"
]
```

### 2. Flyttstädning (130 kr/h)
```typescript
qualityRequirements: [
  "40-punktslista med fotobevis",
  "Före/efter-bilder obligatoriska",
  "Obetalt omarbete vid brister",
  "Kvalitetskontroll enligt standard"
]
```

### 3. Flytt & Städ (130-150 kr/h)
```typescript
qualityRequirements: [
  "Alla krav från både flytt OCH städ",
  "Dubbelkontroll av kvalitet",
  "Rapportering till båda avdelningarna"
]
```

### 4. Kundtjänst (140 kr/h)
```typescript
qualityRequirements: [
  "Professionell kundservice",
  "2h responstid på förfrågningar", 
  "Bokningssystem hantering",
  "CRM-uppdateringar"
]
```

### 5. Flyttledare (185 kr/h)
```typescript
qualityRequirements: [
  "Alla fältkrav PLUS teamledning",
  "Ansvar för kvalitetssäkring",
  "Personalschemaläggning", 
  "Kundkommunikation"
]
```

## 🔄 Workflow

### 1. Generering
1. HR klickar "Generera Anställningsavtal" i personal-profil
2. Väljer rolltyp (flyttpersonal, flyttledare, etc.)
3. System genererar PDF med Puppeteer från HTML-template
4. Avtal sparas med status "draft"

### 2. Skickande  
1. HR klickar "Skicka avtal" 
2. System genererar säker signeringstoken
3. Email skickas till anställd med signeringslänk (mock)
4. Status ändras till "sent" med utgångsdatum (30 dagar)

### 3. Signering
1. Anställd klickar på länk i email
2. Granskar avtal och kvalitetskrav
3. Fyller i bankuppgifter och klädstorlek
4. Signerar digitalt med sitt namn
5. Status ändras till "signed"

### 4. Slutförande
1. HR får automatisk bekräftelse
2. Signerat avtal finns som PDF
3. Bankuppgifter sparas för lönesystem
4. Onboarding-process kan starta

## 🛡️ Säkerhet & Validering

### Token-säkerhet
- Unika signeringstokens per avtal
- Automatisk utgång efter 30 dagar
- Token tas bort efter signering

### Datavalidering
```typescript
// Obligatoriska fält
clearingNumber: /^\d{4}$/           // 4 siffror
accountNumber: /^\d{7,10}$/         // 7-10 siffror  
clothingSize: ['XS','S','M','L','XL','XXL']
signature: minLength(2)             // Minst 2 tecken

// Frivilliga fält
emergencyContact: string
specialRequests: string
```

### GDPR-compliance
- Data används endast för anställningsändamål
- Krypterad dataöverföring
- Säker PDF-lagring
- Användarens IP och User-Agent loggas

## 🔧 Konfiguration

### Environment Variables
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # För signeringslänkar
```

### Fallback-databas (data/contracts.json)
```json
{
  "employees": {
    "staff-001": {
      "name": "Lars Andersson",
      "email": "lars@nordflytt.se", 
      "contracts": { "current": {...} }
    }
  },
  "contractTemplates": {
    "flyttpersonal": { "hourlyRate": "130-165", ... }
  },
  "companyInfo": {
    "name": "Flyttverket Sverige AB",
    "orgNumber": "559215-5484"
  }
}
```

## 🧪 Testning

### Manuell testning
```bash
# 1. Starta server
npm run dev

# 2. Gå till personal-profil  
http://localhost:3000/crm/anstallda/staff-001

# 3. Testa workflow
- Klicka "Avtal"-tab
- Generera avtal för "Flyttledare"
- Skicka avtal (kollar terminal för mock-email)
- Kopiera signeringslänk från terminal
- Signera avtal med testdata
```

### API-testning
```bash
# Testa PDF-generering
curl -X POST http://localhost:3000/api/contracts/generate \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"staff-001","contractType":"flyttledare"}'

# Testa signering
curl -X POST http://localhost:3000/api/contracts/sign \
  -H "Content-Type: application/json" \
  -d '{"signingToken":"abc123","signature":"Test","clearingNumber":"1234","accountNumber":"1234567890","clothingSize":"L"}'
```

## 🔄 Integration med befintligt CRM

### Utan att röra befintlig kod
- **Imports**: Nya komponenter importeras i befintlig personal-profil
- **State**: Ny `contractData` state för avtal-hantering  
- **Callbacks**: `handleContractGenerated()` och `handleContractSent()`
- **Ersättning**: Avtal-tab använder nya komponenter istället för gammal kod

### Dataflow
```
Befintlig CRM → ContractGenerator → API → PDF → ContractStatus → Signering → Bekräftelse
```

## 🚨 Felsökning

### PDF-generering misslyckas
```bash
# Kontrollera Puppeteer-installation
npm ls puppeteer

# Installera om vid behov
npm install puppeteer --save-dev
```

### Avtal hittas inte
```bash
# Kontrollera fallback-databas
cat data/contracts.json | jq .

# Kontrollera PDF-lagring
ls -la public/contracts/
```

### Email skickas inte
```bash
# Email är mock - kontrollera terminal för output
# För riktig email, ersätt sendContractEmail() i send/route.ts
```

### Signeringstoken ogiltig
```bash
# Kontrollera token i databas
# Kontrollera utgångsdatum
# Generera nytt avtal vid behov
```

## 🔮 Framtida förbättringar

### Produktionsklara förbättringar
1. **Riktig email-service** (SendGrid/Nodemailer)
2. **Supabase-integration** istället för JSON-fallback  
3. **BankID-signering** för juridisk säkerhet
4. **PDF-vattenmärkning** med digitala signaturer
5. **Audit-log** för alla avtalsändringar
6. **Automatiska påminnelser** för osignerade avtal
7. **Bulk-generering** för flera anställda
8. **Kontraktsmallar-editor** för HR

### Integrationer
- **Lönesystem**: Automatisk bankuppgiftsexport
- **Personalapp**: Push-notifikationer för signering
- **Dokument-arkiv**: Långtidslagring av signerade avtal
- **Onboarding**: Automatisk start av introduktionsprocess

---

## 📞 Support

För frågor eller förbättringar, kontakta utvecklingsteamet eller uppdatera denna dokumentation.

**Systemet är nu fullt funktionellt som tillägg till befintligt Nordflytt CRM! 🎉**