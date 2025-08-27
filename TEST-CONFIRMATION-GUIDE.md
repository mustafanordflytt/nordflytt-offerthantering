# Test Guide - Bekräfta Tilläggstjänster på Bekräftelsesidan

## 🎯 Vad vi ska testa
Bekräfta att tilläggstjänster som läggs till i Staff App visas korrekt på bekräftelsesidan.

## 📋 Förberedelser
Vi har redan:
- ✅ Ett jobb med ID: `000b8cc1-dabd-4283-9cbf-e6851aec302d`
- ✅ En tilläggstjänst: Specialemballering (250 kr) tillagd av Mustafa
- ✅ En bokning kopplad till jobbet

## 🧪 Test-steg

### 1. Öppna bekräftelsesidan
Öppna denna URL i din webbläsare:
```
http://localhost:3000/order-confirmation/3fa6a931-964e-431b-b3d1-61a6d09c7cb7
```

### 2. Vad du ska se

#### A. Under "Bokade tjänster":
- **Flytthjälp** - 5,000 kr (grundtjänsten)

#### B. Under "Tilläggstjänster under uppdraget":
- **Specialemballering** - +250 kr
- Text: "1 st • Tillagd av Mustafa abdulkarim"
- Blå bakgrund för att visa att det är en tilläggstjänst

#### C. I prissammanfattningen:
- **Grundpris:** 5,000 kr
- **Tilläggstjänster:** +250 kr
- **Totalt pris:** 5,250 kr

### 3. Lägg till fler tjänster i Staff App

1. Gå till Staff App: http://localhost:3000/staff
2. Hitta jobbet "Mustafa Test" 
3. Klicka på jobbet och lägg till fler tjänster:
   - T.ex. "Flyttkartonger" eller "Packtejp"
4. Ladda om bekräftelsesidan - de nya tjänsterna ska visas

## 🔍 Kontrollera i konsollen

Öppna webbläsarens konsoll (F12) på bekräftelsesidan och kolla efter:
```
🔄 Hämtar tilläggstjänster för bokning: [booking-id]
✅ Tilläggstjänster från databas: {additionalServices: [...]}
```

## 📊 Verifiera i databasen

Kör detta script för att se alla tilläggstjänster:
```bash
node check-saved-services.mjs
```

## 🚨 Felsökning

### Om tilläggstjänster inte visas:
1. Kontrollera att jobbet har rätt ID i Staff App
2. Verifiera att API:et svarar (kolla Network-fliken)
3. Kontrollera att booking är kopplad till jobbet

### Om priset inte uppdateras:
1. Kontrollera att trigger körs i databasen
2. Verifiera att `additionalServicesTotal` är större än 0

## ✅ Bekräftelsepunkter

- [ ] Tilläggstjänster visas i separat sektion
- [ ] Varje tjänst visar: namn, antal, pris, vem som lagt till
- [ ] Totalpriset inkluderar tilläggstjänster
- [ ] UI har olika färger för grund- och tilläggstjänster
- [ ] När nya tjänster läggs till uppdateras sidan korrekt