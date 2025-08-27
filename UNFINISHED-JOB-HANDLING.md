# 🚨 Hantering av Oavslutade Jobb i Nordflytt CRM

## 📋 Översikt
Detta dokument beskriver vad som händer om personalen inte avslutar ett jobb korrekt i Staff App.

## 🔴 Konsekvenser av Oavslutat Jobb

### 1️⃣ **Tidsspårning Fortsätter**
```javascript
// Tiden fortsätter att ticka tills någon manuellt stoppar den
// localStorage: time_tracking_123 = { startTime: "2024-01-22T08:00:00", status: "active" }
```

**Problem**:
- ⏱️ Arbetstid fortsätter räknas (även efter arbetstid)
- 💸 Övertid kan ackumuleras felaktigt
- 📊 Felaktiga tidsrapporter

### 2️⃣ **Ingen Faktura Genereras**
- ❌ Kunden får INGEN faktura
- ❌ Ingen orderbekräftelse skapas
- ❌ Fortnox får INGEN information
- ❌ RUT-avdrag kan inte sökas

### 3️⃣ **Jobbstatus Förblir "Pågående"**
- 🟡 Jobbet visas som aktivt i systemet
- 🟡 Personal kan inte ta nya jobb
- 🟡 Schemaläggning påverkas

## 🛡️ Säkerhetsmekanismer

### 1. **Automatisk Påminnelse** (Planerad)
```javascript
// Kommer implementeras:
// Efter 2 timmar över beräknad tid
if (currentTime - estimatedEndTime > 2 * HOUR) {
  sendNotification({
    to: assignedStaff,
    message: "Glöm inte avsluta jobbet!",
    priority: "HIGH"
  })
}
```

### 2. **Admin Dashboard Varningar**
```javascript
// CRM Dashboard visar:
const overdueJobs = jobs.filter(job => {
  const expectedEnd = calculateExpectedEndTime(job)
  return job.status === 'active' && currentTime > expectedEnd + 2 * HOUR
})

// Visas som:
// ⚠️ 3 jobb pågår längre än förväntat
```

### 3. **Daglig Rapport** (E-post till Admin)
```
Oavslutade jobb (2024-01-22):
- Job #123: Pågått 14 timmar (Förväntad: 4h)
- Job #456: Pågått 9 timmar (Förväntad: 3h)
```

## 🔧 Manuell Hantering (Admin)

### Steg 1: Identifiera Problemet
1. Gå till **CRM → Uppdrag**
2. Filtrera på "Pågående" jobb
3. Kontrollera start-tid vs nuvarande tid

### Steg 2: Kontakta Personal
```javascript
// Admin kan:
1. Ring/SMS:a ansvarig personal
2. Kontrollera GPS-position (senast känd)
3. Se foton/dokumentation som tagits
```

### Steg 3: Manuellt Avsluta Jobb
```javascript
// Admin kan force-complete via CRM:
await forceCompleteJob({
  jobId: '123',
  completedBy: 'admin',
  reason: 'Personal glömde avsluta',
  actualEndTime: '17:00', // Manuellt angiven
  notes: 'Bekräftat via telefon med personal'
})
```

### Steg 4: Generera Faktura Retroaktivt
```javascript
// Efter manuell avslutning:
1. Justera arbetstid till korrekt värde
2. Lägg till eventuella tilläggstjänster
3. Generera orderbekräftelse
4. Skicka till Fortnox
```

## 📱 Förbättringsförslag (Implementation Roadmap)

### Fas 1: Push-notifikationer (Prio 1)
```javascript
// Efter förväntad sluttid
scheduleNotification({
  time: estimatedEndTime,
  message: "Dags att avsluta jobbet?",
  actions: ["Avsluta nu", "Påminn om 30 min"]
})
```

### Fas 2: Auto-checkout med bekräftelse (Prio 2)
```javascript
// 2 timmar efter förväntad tid
if (noActivity && overdue > 2 * HOUR) {
  // Skicka SMS
  sendSMS({
    to: staffPhone,
    message: "Jobbet avslutas automatiskt om 30 min. Svara STOP för att förhindra."
  })
  
  // Efter 30 min utan svar
  if (!response) {
    autoCompleteJob(jobId)
  }
}
```

### Fas 3: Geofencing (Prio 3)
```javascript
// När personal lämnar jobbplatsen
onLeaveGeofence(jobLocation, () => {
  showNotification("Du lämnar jobbplatsen. Avsluta jobb?", {
    actions: ["Ja, avsluta", "Nej, återkommer"]
  })
})
```

## 📊 Statistik & Övervakning

### KPI:er att följa
1. **Genomsnittlig försening**: Tid mellan förväntad och faktisk avslutning
2. **Oavslutade jobb per vecka**: Antal som kräver manuell hantering
3. **Övertidskostnad**: Extra kostnader pga sent avslutade jobb

### Dashboard-widget
```javascript
// Realtidsövervakning i CRM
<ActiveJobsMonitor>
  <OverdueJobs count={3} />
  <AverageDelay minutes={45} />
  <ManualInterventions thisWeek={2} />
</ActiveJobsMonitor>
```

## ⚡ Snabbguide för Personal

### Om du glömt avsluta:
1. **Öppna Staff App**
2. **Klicka på det aktiva jobbet**
3. **Välj "Avsluta jobb"**
4. **Ange faktisk sluttid**
5. **Få kundsignatur om möjligt**

### Om kunden redan gått:
1. **Avsluta ändå**
2. **Välj "Skicka bekräftelse via e-post"**
3. **Skriv förklaring i anteckningar**

## 🆘 Nödsituationer

### Personal sjuk/olycka:
```javascript
// Admin emergency override
emergencyCloseAllJobsForStaff(staffId, {
  reason: 'Sjukdom',
  reassignTo: alternativeStaffId,
  notifyCustomers: true
})
```

### Systemfel:
- Kontakta IT-support
- Använd backup-system för tidsrapportering
- Dokumentera manuellt (foto av klockan)

## 📝 Sammanfattning

**Huvudproblem**: Ingen faktura, fortsatt tidräkning, blockerade resurser

**Lösning idag**: Manuell hantering av admin

**Framtida lösning**: Automatiska påminnelser, smart auto-complete, geofencing

**Viktigt**: Utbilda personal om vikten av att avsluta jobb!