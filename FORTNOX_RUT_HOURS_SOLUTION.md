# 🔧 LÖSNING: RUT-timrapportering i Fortnox

## Problem
I bilden syns att "Husarbete" kolumnen visar "Nej" för alla fakturarader, vilket betyder att RUT-timmar inte rapporteras korrekt till Skatteverket.

## Orsaker till problemet

1. **Endast `TaxReductionType: "rut"` räcker inte** - Du måste också sätta `HouseWork: true` på fakturanivå
2. **Artiklar måste vara konfigurerade för RUT i Fortnox** - Artiklar 1, 2, 3 kanske inte är markerade som RUT-artiklar
3. **Felaktig enhetstyp** - För timrapportering bör enheten vara "tim", inte "st"

## Lösning

### 1. Korrekt fakturakonfiguration
```javascript
const invoiceData = {
  Invoice: {
    CustomerNumber: customer.Customer.CustomerNumber,
    InvoiceDate: today,
    DueDate: dueDate.toISOString().split('T')[0],
    Currency: "SEK",
    VATIncluded: false,
    // VIKTIGT: Båda dessa krävs på fakturanivå
    TaxReductionType: "rut",
    HouseWork: true,
    HouseWorkHoursToReport: 24,  // Totala RUT-timmar
    InvoiceRows: [...]
  }
};
```

### 2. Korrekt radkonfiguration för timrapportering
```javascript
{
  ArticleNumber: "1",
  Description: "Flytthjälp - Lastning, transport och lossning (8 tim)",
  DeliveredQuantity: 8,
  Price: 340,  // Timpris
  VAT: 25,
  Unit: "tim",  // VIKTIGT: "tim" för timrapportering
  HouseWork: true,
  HouseWorkType: "MOVINGSERVICES"
}
```

### 3. Alternativ: Fastpris med dold timrapportering

Om du vill visa fastpriser för kunden men ändå rapportera timmar:

#### Steg 1: Konfigurera artiklar i Fortnox
1. Logga in i Fortnox
2. Gå till Register → Artiklar
3. För varje RUT-artikel (1, 2, 3):
   - Markera "Husarbete"
   - Ange standardtimmar (t.ex. 8 tim per tjänst)
   - Välj rätt husarbetstyp

#### Steg 2: Skapa faktura med fastpriser
```javascript
{
  ArticleNumber: "1",
  Description: "Flytthjälp - Lastning, transport och lossning",
  DeliveredQuantity: 1,
  Price: 2720,  // Fastpris (8 tim × 340 kr)
  VAT: 25,
  Unit: "st",
  HouseWork: true,
  HouseWorkType: "MOVINGSERVICES"
}
```

Fortnox rapporterar då automatiskt artikelns standardtimmar till Skatteverket.

## Verifiering i Fortnox

1. **Kontrollera artikelinställningar**:
   - Register → Artiklar
   - Öppna artikel 1, 2, 3
   - Verifiera att "Husarbete" är markerat
   - Kontrollera att standardtimmar är angivna

2. **Efter faktura skapats**:
   - Öppna fakturan i Fortnox
   - Kolumnen "Husarbete" ska visa "Ja" för RUT-rader
   - Klicka på husikonen för att se rapporterade timmar

## Fakturautskick via Fortnox

För att aktivera automatisk utskick:

1. **Via webgränssnitt** (enklast):
   - Öppna fakturan
   - Klicka "Skicka"
   - Välj "E-post"
   - Bekräfta mottagare

2. **Via API** (begränsat):
   - API:et har begränsningar för direktutskick
   - Fakturan måste ofta aktiveras manuellt första gången
   - Därefter fungerar automatiska påminnelser

## Checklista för fungerande RUT

✅ Kund har personnummer (OrganisationNumber)
✅ TaxReductionType: "rut" på fakturanivå
✅ HouseWork: true på fakturanivå (om API:et tillåter)
✅ HouseWorkHoursToReport satt (om API:et tillåter)
✅ Artiklar markerade för husarbete i Fortnox
✅ HouseWork: true på varje RUT-rad
✅ HouseWorkType satt på varje rad
✅ Korrekt enhet ("tim" för timmar, "st" för fastpris)

## Nästa steg

1. **Verifiera artikelkonfiguration** i Fortnox för artiklar 1, 2, 3
2. **Testa med ny token** när du har en ny auktoriseringskod
3. **Kontrollera resultatet** i Fortnox webgränssnitt
4. **Aktivera fakturautskick** manuellt första gången