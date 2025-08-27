# 📸 Manuell Kameratest Guide

## 🚀 Förberedelser

### 1. Kontrollera att Next.js körs
```bash
# I terminal 1
npm run dev
```
Vänta på: `✓ Ready`

### 2. Starta HTTPS tunnel
```bash
# I terminal 2 - välj ett alternativ:

# Option A: Localtunnel (rekommenderas)
npx -y localtunnel --port 3000

# Option B: Ngrok (om du vill)
./ngrok http 3000
```

## 📱 Testning

### Test 1: HTTP (localhost)
1. Öppna: http://localhost:3000/staff
2. Logga in som testanvändare
3. Gå till Dashboard
4. Klicka "Ta foto" på ett jobb

**Förväntat resultat:**
- ✅ Modal med "Välj hur du vill ta fotot"
- ✅ Alternativ: "Använd kamera" och "Välj från galleri"
- ❌ Ingen direkt kameraåtkomst (pga HTTP)

### Test 2: HTTPS (tunnel)
1. Kopiera HTTPS URL från terminal (t.ex. `https://xyz.loca.lt`)
2. Öppna: `https://din-url.loca.lt/staff`
3. Logga in som testanvändare
4. Gå till Dashboard
5. Klicka "Ta foto" på ett jobb

**Förväntat resultat på desktop:**
- ✅ Webbläsaren frågar om kameratillåtelse
- ✅ Live kameravy visas direkt
- ✅ Grön foto-knapp för att ta bild
- ✅ Foto sparas med GPS och tidsstämpel

**Förväntat resultat på mobil:**
- ✅ Val mellan kamera och galleri
- ✅ "Använd kamera" öppnar enhetens kamera
- ✅ "Välj från galleri" öppnar filväljaren

## 🧪 Vad ska testas

### 1. Kameraåtkomst
- [ ] HTTP visar fallback-modal
- [ ] HTTPS ger direkt kameraåtkomst
- [ ] Tillåtelse-prompt visas korrekt

### 2. Fotofunktionalitet
- [ ] Ta foto fungerar
- [ ] Foto sparas i localStorage
- [ ] Bekräftelsemeddelande visas
- [ ] GPS-position registreras (om tillåten)

### 3. Mobil-specifikt
- [ ] Touch-mål är tillräckligt stora (44px)
- [ ] Kamera-app öppnas korrekt
- [ ] Gallerival fungerar

### 4. Felhantering
- [ ] Avslag på kameratillåtelse hanteras
- [ ] Avbryt-knapp fungerar
- [ ] Felmeddelanden är tydliga

## 🐛 Felsökning

### "UI laddas inte"
1. Prova incognito-läge
2. Rensa webbläsarcache
3. Vänta 5-10 sekunder efter sidladdning

### "Kamera fungerar inte"
1. Kontrollera att du använder HTTPS
2. Kontrollera webbläsarens kamerainställningar
3. Stäng andra appar som använder kameran

### "Localtunnel/ngrok fungerar inte"
1. Starta om tunneln
2. Använd ny URL
3. Prova det andra alternativet

## 📋 Testrapport Mall

```
KAMERATEST RAPPORT
==================
Datum: [dagens datum]
Testare: [ditt namn]

HTTP Test (localhost):
- [ ] Fallback-modal visas
- [ ] Galleri-alternativ fungerar
- [ ] Foto sparas korrekt

HTTPS Test (tunnel):
- [ ] Kameratillåtelse begärs
- [ ] Live-preview fungerar
- [ ] Foto tas och sparas
- [ ] GPS registreras

Mobil Test:
- [ ] Kamera-app öppnas
- [ ] Touch-interaktion fungerar
- [ ] Responsiv layout

Kommentarer:
[Eventuella problem eller observationer]
```

## ✅ Framgångskriterier

Testet är godkänt om:
1. HTTP visar fallback med galleri-alternativ
2. HTTPS ger full kameraåtkomst på desktop
3. Mobil fungerar med båda alternativen
4. Foton sparas med korrekt metadata
5. Användarvänlig felhantering

---

**Tips**: Testa gärna på olika enheter och webbläsare för bästa resultat!