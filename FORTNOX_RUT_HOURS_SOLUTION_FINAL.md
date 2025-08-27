# 🔧 LÖSNING: RUT-timrapportering i Fortnox

## Problem
Från bilderna ser vi att:
- ✅ Artikel 1 är korrekt markerad som "Husarbete: Ja" 
- ✅ RUT är aktiverat på fakturan
- ❌ Men "TIMMAR ATT RAPPORTERA" är tomma (ska vara 8 tim per rad)

## Orsak till problemet
När vi försöker sätta `HouseWorkHoursToReport` på fakturaraden får vi felet "Felaktigt fältnamn", vilket betyder att:

1. **API:et stödjer inte detta fält på radnivå**
2. **Timrapportering måste göras på annat sätt**

## Lösningar

### Option 1: Manuell rapportering i Fortnox (ENKLAST)
1. Öppna faktura #6 i Fortnox
2. Klicka på husikonen (som i bild 4)
3. Fyll i timmar manuellt:
   - Flytthjälp: 8 tim
   - Packtjänst: 8 tim
   - Flyttstädning: 8 tim
4. Klicka "Spara"

### Option 2: Konfigurera standardtimmar på artikeln
1. Gå till Register → Artiklar
2. Öppna artikel 1, 2, och 3
3. Under "Husarbete" fliken, sätt:
   - **Standardtimmar**: 8
   - **Husarbetstyp**: Flyttjänster/Städning
4. Spara artikeln

När du sedan använder artikeln på en faktura kommer standardtimmarna automatiskt fyllas i.

### Option 3: Använd enheten "tim" istället för "st"
```javascript
{
  ArticleNumber: "1",
  Description: "Flytthjälp - Lastning, transport och lossning",
  DeliveredQuantity: 8,    // 8 timmar
  Price: 340,              // Timpris
  Unit: "tim",             // Timmar som enhet
  HouseWork: true,
  HouseWorkType: "MOVINGSERVICES"
}
```

Detta visar timmar för kunden men rapporterar också automatiskt till Skatteverket.

### Option 4: Undersök om det finns ett annat API-fält
Möjliga fältnamn att testa:
- `HouseWorkHours`
- `TaxReductionHours`
- `WorkHours`
- `Hours`

Men troligen stöds inte timrapportering via API på radnivå.

## Rekommendation

**För snabbaste lösningen:**
1. Använd **Option 1** - Gå in manuellt och fyll i timmarna för faktura #6
2. För framtida fakturor, använd **Option 2** - Konfigurera standardtimmar på artiklarna

**För automatisering:**
- Använd **Option 3** om det är OK att visa timmar för kunden
- Annars måste timrapportering göras manuellt i Fortnox

## Sammanfattning

Fortnox API verkar inte stödja att sätta RUT-timmar på fakturarader när man använder fastpriser (Unit: "st"). Lösningen är antingen:
- Manuell rapportering i webgränssnittet
- Konfigurera standardtimmar på artikelnivå
- Visa timmar direkt på fakturan (Unit: "tim")

Detta är en begränsning i Fortnox API, inte ett fel i vår implementation.