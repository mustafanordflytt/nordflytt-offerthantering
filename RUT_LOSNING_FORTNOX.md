# 🔧 LÖSNING: Så får du RUT att fungera i Fortnox

## 🚨 Problemet
När du skapar fakturor i Fortnox visas "Husarbete: Inget" även om du sätter `HouseWork: true` på fakturarader.

## ✅ Lösningen - 5 kritiska krav

### 1. **Kunden MÅSTE ha personnummer**
```javascript
const customerData = {
  Customer: {
    Name: "Karin Nilsson",
    Email: "karin.nilsson@gmail.com",
    Phone1: "0709876543",
    Address1: "Kungsgatan 28",
    City: "Stockholm",
    ZipCode: "11156",
    Type: "PRIVATE",
    // KRITISKT: Personnummer krävs för RUT!
    OrganisationNumber: "19850315-4567"
  }
};
```

### 2. **Artiklar måste finnas i Fortnox**
Skapa dessa artiklar först:
- Artikel 2: Flytthjälp (SERVICE, HouseWork: true)
- Artikel 3: Packning (SERVICE, HouseWork: true)  
- Artikel 4: Städning (SERVICE, HouseWork: true)
- Artikel 101: Flyttkartonger (STOCK, HouseWork: false)

### 3. **Använd artikelnummer på fakturarader**
```javascript
InvoiceRows: [
  {
    ArticleNumber: "2",  // MÅSTE referera till artikel med HouseWork: true
    Description: "Flytthjälp - Lastning, transport och lossning (10 tim)",
    DeliveredQuantity: 10,
    Price: 272,
    VAT: 25,
    Unit: "tim",
    HouseWork: true  // Sätt även här
  },
  {
    ArticleNumber: "101",  // Material-artikel har HouseWork: false
    Description: "Packmaterial",
    DeliveredQuantity: 20,
    Price: 72,
    VAT: 25,
    Unit: "st",
    HouseWork: false  // Ej RUT-berättigat
  }
]
```

### 4. **HouseWork sätts ENDAST på radnivå**
```javascript
Invoice: {
  CustomerNumber: customer.CustomerNumber,
  InvoiceDate: today,
  DueDate: dueDate,
  Currency: "SEK",
  VATIncluded: false,
  // INTE HÄR! HouseWork på fakturanivå är read-only
  InvoiceRows: [
    // HouseWork sätts på varje rad istället
  ]
}
```

### 5. **Detaljerad fakturatext för Skatteverket**
```javascript
const fakturaText = `Flyttjänster utförda ${today}:

Flytt från ${fromAddress} till ${toAddress}.

Utförda tjänster enligt RUT-avdrag:
- Flytthjälp: Lastning, transport och lossning (10 arbetstimmar à 340 kr/tim)
- Packtjänst: Professionell packning av ömtåligt gods (10 arbetstimmar à 340 kr/tim)
- Flyttstädning: Komplett städning enligt checklista (10 arbetstimmar à 340 kr/tim)

Totalt 30 arbetstimmar utförda av certifierad flyttpersonal.

VIKTIGT: Om RUT-avdraget nekas helt eller delvis av Skatteverket har Nordflytt AB 
rätt att fakturera kunden återstående belopp enligt gällande lagstiftning.`;
```

## 📝 Komplett exempel
```javascript
// 1. Skapa artikel först (engångskonfiguration)
const articleData = {
  Article: {
    ArticleNumber: "2",
    Description: "Flytthjälp",
    Type: "SERVICE",
    SalesPrice: 340,  // Timpris inkl moms
    VAT: 25,
    Unit: "tim",
    HouseWork: true  // Markera artikeln som RUT-berättigad
  }
};

// 2. Skapa kund med personnummer
const customerData = {
  Customer: {
    Name: "Anna Svensson",
    OrganisationNumber: "19850315-4567",  // MÅSTE ha personnummer!
    Type: "PRIVATE",
    // ... övriga fält
  }
};

// 3. Skapa faktura med rätt struktur
const invoiceData = {
  Invoice: {
    CustomerNumber: customerNumber,
    InvoiceDate: today,
    DueDate: dueDate,
    Currency: "SEK",
    VATIncluded: false,
    InvoiceRows: [
      {
        ArticleNumber: "2",  // Referera till RUT-artikel
        Description: "Flytthjälp (10 tim à 272 kr/tim ex moms)",
        DeliveredQuantity: 10,
        Price: 272,  // Ex moms
        VAT: 25,
        Unit: "tim",
        HouseWork: true  // Aktivera RUT på raden
      }
    ],
    Remarks: detaljerad_fakturatext
  }
};
```

## ⚠️ Vanliga fel att undvika

1. **Försöka sätta HouseWork på fakturanivå** - Det är read-only!
2. **Kund utan personnummer** - RUT fungerar bara för privatpersoner
3. **Saknade artiklar** - Artiklar måste finnas och ha HouseWork: true
4. **För vag fakturatext** - Skatteverket kräver detaljerad beskrivning
5. **Glömma att inkludera RUT-villkor** - Viktigt om avdraget nekas

## 🎯 Resultat när allt är rätt
- Husarbete visas som "MOVINGSERVICES" eller "CLEANING" (inte "Inget")
- RUT-avdrag aktiveras automatiskt
- Skatteverket får korrekt underlag
- Kunden betalar endast 50% av arbetskostnaden

## 💡 Tips
- Testa först i Fortnox testmiljö
- Kontrollera att ditt Fortnox-konto har RUT-behörighet aktiverat
- Använd timpris för transparens mot Skatteverket
- Spara artikelnummer som konstanter i din kod