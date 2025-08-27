# 🧪 Testguide för BankID & Kreditkontroll

## Förberedelser

1. **Starta utvecklingsservern:**
   ```bash
   npm run dev
   ```

2. **Installera Puppeteer (om inte redan gjort):**
   ```bash
   npm install puppeteer
   ```

## Test 1: Automatiserat test med Puppeteer

```bash
node test-credit-check-flow.js
```

Detta kör ett automatiserat test som:
- Skapar en test-offert
- Navigerar till offert-sidan
- Klickar på "Boka flytthjälp"
- Verifierar att BankID-modal visas
- Kontrollerar omdirigeringen
- Tar screenshots

## Test 2: Manuell testning

### A. Skapa test-offert
1. Öppna: http://localhost:3000/api/test-create-offer
2. Kopiera offert-ID från svaret
3. Gå till: http://localhost:3000/offer/[OFFERT-ID]

### B. Testa godkänd kreditkontroll
1. På offert-sidan, klicka "Boka flytthjälp"
2. BankID-modal ska visas (om privatperson + faktura)
3. I test-miljö simuleras godkänd kreditkontroll efter ~2 sekunder
4. Du ska omdirigeras till bekräftelsesidan
5. Ingen varning ska visas

### C. Testa nekad kreditkontroll
För att testa nekad kreditkontroll, ändra temporärt i `/hooks/useCreditCheck.ts`:
```javascript
// Rad 51: Ändra från
const isApproved = Math.random() > 0.3;
// Till
const isApproved = false; // Alltid neka för test
```

Sedan:
1. Upprepa steg A och B
2. Efter BankID ska kreditkontroll nekas
3. Du ska omdirigeras till bekräftelsesidan med `?creditRejected=true`
4. Orange varningsruta ska visas överst
5. Betalmetod ska ha bytts till Swish

## Test 3: Kontrollera databas

Efter test, kontrollera att data sparats korrekt:

```sql
-- I Supabase SQL Editor:
SELECT 
  id,
  customer_name,
  personal_number,
  legal_name,
  given_name,
  surname,
  payment_method,
  credit_check_status,
  credit_check_date
FROM bookings 
WHERE id = '[DITT-OFFERT-ID]';
```

## Test 4: Olika scenarier

### Företagskund (ingen kreditkontroll):
1. Ändra `customerType` till 'business' i test-offerten
2. BankID ska INTE visas
3. Bokning ska gå direkt igenom

### Swish-betalning (ingen kreditkontroll):
1. Ändra `paymentMethod` till 'swish' i test-offerten
2. BankID ska INTE visas
3. Bokning ska gå direkt igenom

## Creditsafe Sandbox

**Test-credentials (redan konfigurerade):**
- Username: FLYTTSVETESTIN
- Password: Flyttsvetestin123!
- Endpoint: https://casapi.creditsafe.se/casapi/cas.asmx

**Test-personnummer som fungerar i sandbox:**
- 195001182046 - Godkänd kreditkontroll
- 196512131234 - Nekad kreditkontroll
- 198001012389 - Godkänd med låg kreditgräns

## Felsökning

### BankID-modal visas inte:
- Kontrollera att `customerType` är 'private'
- Kontrollera att `paymentMethod` är 'invoice'
- Kolla browser console för fel

### Kreditkontroll körs inte:
- Kontrollera att BankID-autentisering lyckas
- Kolla Network-fliken för `/api/credit-check` anrop
- Kontrollera server-loggar

### Omdirigering fungerar inte:
- Kontrollera att booking finns i databasen
- Kolla att status uppdateras till 'Accepterad'
- Verifiera att Next.js router används korrekt

## Screenshots från test

Efter körning hittar du:
- `test-bankid-modal.png` - BankID-modalens utseende
- `test-order-confirmation.png` - Bekräftelsesidan
- `test-error.png` - Eventuella fel