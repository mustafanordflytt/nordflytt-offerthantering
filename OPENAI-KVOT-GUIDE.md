# 🤖 OpenAI API-kvot - Uppgraderingsguide

## ⚠️ Nuvarande problem
Din OpenAI API-nyckel (`sk-proj-JS...`) har överskridit sin kvot, vilket ger felmeddelandet:
```
429 You exceeded your current quota, please check your plan and billing details
```

## 📋 Steg-för-steg guide för att fixa detta:

### 1️⃣ Logga in på OpenAI Platform
1. Gå till: https://platform.openai.com/login
2. Logga in med ditt OpenAI-konto

### 2️⃣ Gå till Billing & Usage
1. Klicka på ditt namn/organisation uppe till höger
2. Välj **"Billing"** från dropdown-menyn
3. Eller gå direkt till: https://platform.openai.com/account/billing

### 3️⃣ Kontrollera din nuvarande status
På billing-sidan ser du:
- **Current balance**: Ditt nuvarande saldo
- **Usage this month**: Hur mycket du använt denna månad
- **Rate limits**: Din nuvarande kvot per minut/dag

### 4️⃣ Lägg till krediter (Rekommenderat för snabb start)
1. Klicka på **"Add payment method"** eller **"Add to credit balance"**
2. Lägg till ett betalkort
3. Välj belopp att ladda upp:
   - **$10** - Bra för test och utveckling (~200,000 tokens)
   - **$25** - Rekommenderat för produktion (~500,000 tokens)
   - **$50** - Om du förväntar dig hög trafik

### 5️⃣ Alternativ: Uppgradera till Pay-as-you-go
1. Under **"Billing overview"**
2. Klicka på **"Set up paid account"**
3. Detta tar bort gratis-kvotens begränsningar

### 6️⃣ Vänta på aktivering
- Krediter aktiveras vanligtvis direkt
- Ibland kan det ta upp till 5 minuter

## 💡 Tips för kostnadsoptimering:

### Använd rätt modell
```javascript
// För enkel konversation (billigare):
model: 'gpt-3.5-turbo'  // $0.002 per 1K tokens

// För komplex reasoning (dyrare):
model: 'gpt-4'          // $0.03 per 1K tokens
```

### Begränsa token-användning
```javascript
// I din kod, sätt max_tokens:
max_tokens: 150,  // Begränsar svarlängden
temperature: 0.7  // Lägre = mer fokuserade svar
```

### Implementera caching
```javascript
// Spara vanliga frågor/svar för att minska API-anrop
const commonResponses = {
  'priser': 'Cached response...',
  'öppettider': 'Cached response...'
}
```

## 🧪 Verifiera att det fungerar

När du lagt till krediter, kör:
```bash
node test-openai-integration.mjs
```

Du bör se:
```
✅ API-anslutning fungerar!
🤖 Majas svar:
[AI-genererat svar här]
```

## 📊 Uppskattad kostnad för Nordflytt

Baserat på typisk användning:
- **100 chattar/dag** × 10 meddelanden × 150 tokens = ~150,000 tokens/dag
- **Månadskostnad**: ~$10-15 med GPT-3.5-turbo

## 🔗 Användbara länkar

- **OpenAI Pricing**: https://openai.com/pricing
- **Usage Dashboard**: https://platform.openai.com/usage
- **API Keys**: https://platform.openai.com/api-keys
- **Rate Limits**: https://platform.openai.com/docs/guides/rate-limits

## ⚡ Snabblösning (om bråttom)

Om du behöver testa direkt utan att vänta:
1. Skapa ett nytt OpenAI-konto (ny e-post)
2. Få $5 gratis krediter för test
3. Generera ny API-nyckel
4. Uppdatera `.env.development.local`

---

**OBS**: För produktion rekommenderas alltid ett betalt konto för stabilitet och högre kvoter.