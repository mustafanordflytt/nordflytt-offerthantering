# 📊 Fortnox Faktureringsflöde i Nordflytt CRM

## 🔄 Översikt av flödet

Information skickas till Fortnox i följande steg:

### 1️⃣ **Bokningsskapande** (Startar processen)
När en kund bokar via formuläret:
- Bokning sparas i Supabase
- Kund skapas i systemet
- **INGEN** faktura skapas ännu

### 2️⃣ **Jobbstart** (Staff App)
När personal startar jobbet:
- GPS-position registreras
- Tidsspårning börjar
- Checklista visas
- **INGEN** faktura skapas ännu

### 3️⃣ **Under jobbet** 
Personal kan:
- Lägga till extra tjänster
- Ta foton för dokumentation
- Registrera material
- **INGEN** faktura skapas ännu

### 4️⃣ **Jobbavslutning** (TRIGGER PUNKT!) 🎯
När personal klickar "Avsluta jobb":

```javascript
// components/staff/JobCompletionModal.tsx
handleCompleteJob() {
  // 1. Stoppa tidsspårning
  // 2. Samla ihop all data:
  //    - Faktisk arbetstid
  //    - Extra tjänster som lagts till
  //    - Material som använts
  //    - Foton och dokumentation
  
  // 3. Visa OrderConfirmationModal
  setShowOrderConfirmation(true)
}
```

### 5️⃣ **Orderbekräftelse signeras**
När kunden signerar:

```javascript
// components/staff/OrderConfirmationModal.tsx
handleGenerateInvoice() {
  // Detta är när Fortnox-integrationen triggas!
  
  const response = await fetch('/api/generate-fortnox-invoice', {
    method: 'POST',
    body: JSON.stringify({
      bookingId: jobData.bookingId,
      completionData: {
        actualHours: totalWorkTime,
        addedServices: extraServices,
        materials: usedMaterials,
        staffNotes: completionNotes
      }
    })
  })
}
```

### 6️⃣ **Fortnox API anropas**
`/api/generate-fortnox-invoice/route.ts` gör följande:

```javascript
// 1. Hämta kunddata från Supabase
const customer = await getCustomerFromBooking(bookingId)

// 2. Skapa/hitta kund i Fortnox
const fortnoxCustomer = await fortnox.ensureCustomerExists({
  name: customer.name,
  email: customer.email,
  personalNumber: customer.personalNumber,
  address: customer.address
})

// 3. Skapa faktura med:
//    - Grundtjänster från bokningen
//    - Extra tjänster tillagda under jobbet
//    - Material som använts
//    - RUT-avdrag automatiskt beräknat

const invoice = await fortnox.createInvoice({
  customerNumber: fortnoxCustomer.customerNumber,
  rows: [
    // Flyttjänst med faktiska timmar
    {
      description: "Flytthjälp",
      hours: actualHours,
      price: 400,
      houseworkType: "MOVINGSERVICES"
    },
    // Extra tjänster
    ...addedServices.map(service => ({
      description: service.name,
      quantity: service.quantity,
      price: service.price,
      housework: service.rutEligible
    }))
  ]
})

// 4. RUT-ansökan skapas automatiskt
const rutApplication = await fortnox.createRUTApplication({
  invoiceNumber: invoice.invoiceNumber,
  personalNumber: customer.personalNumber,
  hours: totalRutHours
})
```

## 📋 Data som skickas till Fortnox

### Kunddata:
- Namn
- Personnummer (för RUT)
- E-post
- Telefon
- Adress

### Faktureringsinformation:
- Tjänster med faktiska timmar
- Material och förbrukning
- RUT-berättigade timmar
- Tilläggstjänster

### RUT-information:
- Personnummer
- Antal arbetade timmar per tjänst
- Tjänstetyp (MOVINGSERVICES, CLEANING, etc.)

## 🔐 Säkerhet & Konfiguration

Fortnox-integration kräver:
```env
FORTNOX_CLIENT_ID=xvekSW7cqRsf
FORTNOX_CLIENT_SECRET=YhfvjemECo
FORTNOX_ACCESS_TOKEN=<giltig-token>
FORTNOX_TENANT_ID=1573825
```

## 🚨 Viktigt att veta

1. **Faktura skapas ENDAST när**:
   - Jobbet är avslutat
   - Kund har signerat orderbekräftelse
   - All nödvändig data finns

2. **Automatiska processer**:
   - RUT-avdrag beräknas automatiskt
   - Kund skapas automatiskt om den inte finns
   - Fakturanummer genereras av Fortnox

3. **Felhantering**:
   - Om Fortnox-anrop misslyckas sparas data lokalt
   - Retry-mekanism finns för misslyckade anrop
   - Admin notifieras vid kritiska fel

## 🎯 Sammanfattning

**Trigger-punkt**: När kunden signerar orderbekräftelsen i Staff App efter jobbets slutförande.

**Tidpunkt**: Direkt efter signering (realtid)

**Innehåll**: All jobbdata inklusive faktiska timmar, tilläggstjänster och material.