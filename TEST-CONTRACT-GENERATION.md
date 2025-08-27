# 🧪 Test av Avtalsgenerering

## Problem
När du försöker generera avtal får du ett fel.

## Möjliga orsaker

### 1. Staff ID mismatch
- Frontend skickar kanske fel ID-format
- API förväntar sig `staff-009` men får kanske bara `009`

### 2. Puppeteer-problem
- Puppeteer kanske inte kan starta i din miljö
- Behöver särskilda flaggor för macOS

### 3. Filrättigheter
- Kanske inte kan skriva till public/contracts

## Felsökning

### Steg 1: Kontrollera exakt fel
Öppna Developer Tools → Network tab och se vad som skickas till `/api/contracts/generate`

### Steg 2: Kontrollera loggarna
I terminalen där du kör `npm run dev`, se om det finns felmeddelanden

### Steg 3: Testa direkt API-anrop
```bash
curl -X POST http://localhost:3000/api/contracts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "staff-009",
    "contractType": "flyttpersonal_b_korkort"
  }'
```

## Lösning jag implementerat
1. API:et hämtar nu automatiskt anställningsdata om den inte finns i contracts.json
2. Skapar employee-objekt dynamiskt
3. Lägger till i contracts.json för framtida användning

## Om det fortfarande inte fungerar
Kontrollera:
1. Att Puppeteer är korrekt installerat: `npm list puppeteer`
2. Att du har rättigheter att skriva till public/contracts
3. Att employeeId matchar (staff-009 eller bara 009)