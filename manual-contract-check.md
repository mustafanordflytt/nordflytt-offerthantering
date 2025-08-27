# Manuell kontroll av Avtal-fliken

## Steg för att verifiera:

1. **Starta servern** (om den inte redan är igång):
   ```bash
   npm run dev
   ```

2. **Öppna webbläsaren** och gå till:
   ```
   http://localhost:3000/crm/anstallda/staff-007
   ```

3. **Klicka på "Avtal" fliken**

## Vad du ska se:

### ✅ Korrekt UI ska innehålla:
- **Anställningsavtal** - En sektion med:
  - Rubrik: "Anställningsavtal" med ikon
  - Text: "Generera och hantera anställningsavtal för Lars Andersson"
  - En "Generera Anställningsavtal" knapp

- **Avtalsstatus** - En sektion som visar:
  - Rubrik: "Avtalsstatus"
  - Om inget avtal finns: "Inget avtal genererat än"
  - Om avtal finns: Visa status med knappar för att förhandsgranska/skicka

### ❌ Om du fortfarande ser fel innehåll:
- Kontaktinformation istället för avtalshantering
- Endast en enkel knapp med alert

## Felsökning:

1. **Gör en hård refresh**: Cmd+Shift+R (Mac) eller Ctrl+Shift+F5 (Windows)

2. **Kontrollera konsolen** (högerklicka → Inspect → Console):
   - Leta efter fel som "Event handlers cannot be passed..."
   - Leta efter andra JavaScript-fel

3. **Om det inte fungerar**, prova:
   ```bash
   # Stoppa servern (Ctrl+C)
   rm -rf .next
   npm run dev
   ```

## Rapportera tillbaka:
Berätta vad du ser i Avtal-fliken!