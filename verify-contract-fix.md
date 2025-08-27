# Verifiera Contract Fix

## Steg att följa:

1. **Stoppa servern** (Ctrl+C)

2. **Rensa cache helt**:
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

3. **Starta servern igen**:
   ```bash
   npm run dev
   ```

4. **Vänta tills servern är helt klar** (du ser "Ready in X ms")

5. **Öppna en ny inkognito-flik** i webbläsaren

6. **Gå till**: http://localhost:3000/crm/anstallda/staff-007

7. **Klicka på "Avtal" fliken**

## Vad du ska se nu:

✅ **Anställningsavtal** sektion med:
- Rubrik med FileText-ikon
- Text: "Generera och hantera anställningsavtal för Lars Andersson"
- "Generera Anställningsavtal" knapp

✅ **Avtalsstatus** sektion med:
- Rubrik "Avtalsstatus"
- Status: "Inget avtal genererat än"

## Om det fortfarande inte fungerar:

1. Kontrollera att alla ändringar sparats
2. Kolla terminalen för fel vid kompilering
3. Öppna utvecklarkonsolen (F12) och kolla efter fel

## Ändringar som gjorts:

1. Skapade `ContractTab` wrapper-komponent
2. La till 'use client' på alla UI-komponenter:
   - button.tsx
   - card.tsx
   - badge.tsx
3. Isolerade hela contract-flödet i client-komponenter