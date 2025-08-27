# 📊 STATUS: Fortnox RUT-implementation

## Problem med "Husarbete: Nej"

I bilden ser vi att alla fakturarader visar "Nej" under "Husarbete" kolumnen, vilket betyder att RUT-timmar inte rapporteras korrekt.

### Troliga orsaker:

1. **Artiklar inte konfigurerade för RUT i Fortnox**
   - Artiklar 1, 2, 3 måste vara markerade som "Husarbete" i Fortnox artikelregister
   - Gå till: Register → Artiklar → Öppna artikel 1, 2, 3
   - Markera "Husarbete" och ange standardtimmar

2. **API-begränsningar**
   - Vissa fält som `HouseWork` på fakturanivå kan vara read-only
   - `HouseWorkHoursToReport` på radnivå är inte ett giltigt fält

3. **Felaktig enhetstyp**
   - För timrapportering bör enheten vara "tim" istället för "st"
   - Men om ni vill visa fastpriser måste artikeln ha rätt konfiguration

## Lösningsförslag

### Option 1: Konfigurera artiklar korrekt
1. Logga in i Fortnox
2. Gå till Register → Artiklar
3. För artikel 1, 2, 3:
   - Markera "Husarbete"
   - Välj rätt husarbetstyp (Flyttjänster/Städning)
   - Ange standardtimmar (t.ex. 8 tim)
4. Skapa ny faktura med samma kod

### Option 2: Använd timrapportering
Ändra från fastpriser till timmar:
```javascript
{
  ArticleNumber: "1",
  Description: "Flytthjälp (8 tim)",
  DeliveredQuantity: 8,  // Antal timmar
  Price: 340,           // Timpris
  Unit: "tim",          // Timmar som enhet
  HouseWork: true,
  HouseWorkType: "MOVINGSERVICES"
}
```

### Option 3: Skapa nya RUT-artiklar
Skapa specifika artiklar för RUT i Fortnox:
- FLYTT-RUT: Flytthjälp med RUT
- PACK-RUT: Packning med RUT
- STAD-RUT: Städning med RUT

## Token-problem

Den nya token ger "unauthorized" även om den är giltig. Möjliga orsaker:
- Token har redan använts (OAuth tokens kan bara användas en gång)
- Behöver ny authorization code

För ny token, gå till:
https://apps.fortnox.se/oauth-v1/auth?client_id=xvekSW7cqRsf&redirect_uri=https://localhost:3000/callback&response_type=code&scope=customer+invoice+article+companyinformation

## Nästa steg

1. **Verifiera artikelkonfiguration** i Fortnox för artikel 1, 2, 3
2. **Få ny authorization code** om du vill testa mer
3. **Kontrollera i Fortnox** om faktura #6 har rätt RUT-inställningar

Faktura #6 skapades med:
- ✅ TaxReductionType: "rut"
- ✅ TaxReduction: 5100 kr
- ❓ Men "Husarbete" visar "Nej" på raderna

Detta tyder på att artiklar 1, 2, 3 inte är konfigurerade som RUT-artiklar i Fortnox.