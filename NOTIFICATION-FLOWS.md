# 📧 Nordflytt Notifikationsflöden - Verifieringsguide

## 🔔 Översikt av alla notifikationer

### 1. **Bokningsbekräftelse** (Direkt vid bokning)
- **SMS**: Kort bekräftelse med boknings-ID
- **Email**: Detaljerad bekräftelse med alla uppgifter
- **Trigger**: När kund slutför bokningsformuläret

### 2. **Jobbpåminnelse** (24h innan)
- **SMS**: Kort påminnelse om tid
- **Email**: Detaljerad checklista och förberedelser
- **Trigger**: Cron job 24h innan flyttdatum

### 3. **Team på väg** (30 min innan)
- **SMS**: ETA och teamledare info
- **Trigger**: När team startar från kontor/föregående jobb

### 4. **Orderbekräftelse** (Efter jobbet)
- **Email**: Sammanfattning av utfört arbete
- **Trigger**: När kund signerar digitalt i Staff App

### 5. **Faktura** (Efter jobbet)
- **Email**: Faktura med betalningsinfo
- **SMS**: Påminnelse om faktura (om ej betald efter 7 dagar)
- **Trigger**: När orderbekräftelse signeras ELLER auto-fakturering kl 18:00

### 6. **OTP för Staff Login**
- **SMS**: 6-siffrig kod för inloggning
- **Trigger**: När personal anger telefonnummer vid login

## 🧪 Snabb verifiering av varje flöde

### Test 1: Bokningsbekräftelse
```bash
# Skapa en testbokning via formuläret
# ELLER kör:
curl -X POST http://localhost:3000/api/send-booking-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@example.com",
    "customerPhone": "0701234567",
    "customerName": "Test Kund",
    "bookingDetails": {
      "date": "2024-01-25",
      "fromAddress": "Testgatan 1",
      "toAddress": "Målgatan 2",
      "service": "Flytthjälp"
    }
  }'
```

### Test 2: OTP SMS
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "0701234567"}'
```

### Test 3: Komplett test suite
```bash
# Kör alla tester
node test-all-notifications.js

# Hoppa över SMS (om du inte vill slösa krediter)
SKIP_SMS_TEST=true node test-all-notifications.js

# Hoppa över Email
SKIP_EMAIL_TEST=true node test-all-notifications.js
```

## 🔍 Var notifikationer triggas i koden

| Notifikation | Fil | Funktion |
|-------------|-----|----------|
| Bokningsbekräftelse | `/api/submit-booking/route.ts` | Efter bokning sparats |
| OTP SMS | `/api/auth/send-otp/route.ts` | Vid personalinloggning |
| Team på väg | `/components/staff/JobCard.tsx` | När "Starta jobb" klickas |
| Orderbekräftelse | `/components/staff/OrderConfirmationModal.tsx` | Efter kundsignatur |
| Faktura | `/api/generate-fortnox-invoice/route.ts` | Efter orderbekräftelse |
| Auto-faktura | `/api/jobs/auto-invoice/route.ts` | Dagligen kl 18:00 |

## 🛠️ Felsökning

### Problem: SMS kommer inte fram
1. **Kontrollera Twilio-saldo**
   ```bash
   node -e "
   import { SmsService } from './lib/notifications/sms-service.js';
   const balance = await SmsService.getBalance();
   console.log(balance);
   "
   ```

2. **Verifiera miljövariabler**
   ```bash
   grep TWILIO .env.local .env.production
   ```

3. **Test direkt Twilio**
   ```bash
   curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json \
     -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
     -d "From=$TWILIO_PHONE_NUMBER" \
     -d "To=+46701234567" \
     -d "Body=Test"
   ```

### Problem: Email kommer inte fram
1. **Kontrollera SendGrid API**
   ```bash
   curl -X POST https://api.sendgrid.com/v3/mail/send \
     -H "Authorization: Bearer $SENDGRID_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "personalizations": [{
         "to": [{"email": "test@example.com"}]
       }],
       "from": {"email": "test@nordflytt.se"},
       "subject": "Test",
       "content": [{
         "type": "text/plain",
         "value": "Test email"
       }]
     }'
   ```

2. **Kontrollera spam-mapp**
   - SendGrid emails kan hamna i spam första gången

## 📊 Övervaknings-dashboard

### Twilio Console
- URL: https://console.twilio.com
- Kontrollera: Message logs, Error logs, Account balance

### SendGrid Dashboard  
- URL: https://app.sendgrid.com
- Kontrollera: Activity feed, Suppressions, Stats

## 🔐 Säkerhetskontroll

### Miljövariabler som krävs:
```env
# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+46xxxxxxxxx

# SendGrid (Email)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@nordflytt.se

# Test
TEST_PHONE=+46701234567
TEST_EMAIL=test@nordflytt.se
```

## ✅ Checklista för produktionsdrift

- [ ] Twilio-konto har tillräckligt med krediter
- [ ] SendGrid daglig kvot är tillräcklig (100/dag gratis)
- [ ] Alla miljövariabler är satta i produktion
- [ ] Test-notifikationer fungerar
- [ ] Felhantering loggar till monitoring
- [ ] Backup SMS-provider konfigurerad (optional)
- [ ] Email-templates är responsiva
- [ ] Unsubscribe-länkar i marketing emails
- [ ] GDPR-compliance för datalagring

## 📈 Statistik att följa

1. **SMS Success Rate**: >95% förväntat
2. **Email Delivery Rate**: >98% förväntat
3. **Email Open Rate**: >60% för transaktionella
4. **SMS Kostnad**: ~0.30 SEK per SMS
5. **Genomsnittlig responstid**: <2 sekunder