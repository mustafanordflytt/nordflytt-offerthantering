# 🔗 Staff-till-CRM Tidsrapportering - Implementering Klar!

## ✅ Vad som är implementerat:

### 1. **Databas-struktur (klar att köra)**
- SQL-fil skapad: `supabase/migrations/create_staff_timereports.sql`
- Innehåller tabeller, index och vyer för tidsrapportering

### 2. **Staff-Employee Sync (`lib/staff-employee-sync.ts`)**
- `createStaffSession()` - Kopplar staff-login till CRM-anställd
- `logWorkTime()` - Loggar arbetstid till databasen
- `getEmployeeWorkTime()` - Hämtar arbetstid för en anställd
- `getTodaysWorkTime()` - Hämtar dagens arbetstid

### 3. **Automatisk tidsloggning i staff-appen**
- När personal startar jobb → loggas till CRM
- När personal avslutar jobb → loggas till CRM
- GPS-position sparas för både start och slut

### 4. **CRM-komponent för visning**
- `components/crm/EmployeeTimeReports.tsx` - Visar arbetstid i CRM

## 🚀 Aktivera funktionen:

### Steg 1: Kör SQL i Supabase
```bash
# Kör setup-skriptet för att se SQL:en
node setup-timereports.js
```

Kopiera SQL:en och kör i Supabase SQL Editor.

### Steg 2: Skapa anställda i CRM med rätt email
För att demo-inloggningarna ska fungera med CRM, skapa anställda med dessa emails:
- erik@nordflytt.se
- sofia@nordflytt.se  
- marcus@nordflytt.se

### Steg 3: Lägg till komponenten i CRM
I anställd-detaljvyn (`/app/crm/anstallda/[id]/page.tsx`), lägg till:

```tsx
import EmployeeTimeReports from '@/components/crm/EmployeeTimeReports'

// I komponenten:
<EmployeeTimeReports 
  employeeId={employee.id} 
  employeeName={employee.name} 
/>
```

## 📊 Hur det fungerar:

1. **Personal loggar in i staff-appen**
   - System kollar om email finns i CRM
   - Om ja → employee_id sparas i sessionen
   - Om nej → använder demo-data

2. **När personal startar jobb**
   - GPS-position registreras
   - Tid loggas till `staff_timereports` tabellen
   - Status sätts till 'active'

3. **När personal avslutar jobb**
   - Sluttid och GPS registreras
   - Duration beräknas automatiskt
   - Övertid beräknas om jobbet tog längre än planerat

4. **I CRM ser chefer**
   - Pågående arbeten i realtid
   - Dagens arbetstid per anställd
   - Historik över alla jobb
   - Övertidsrapporter

## 🔍 Testa funktionen:

1. Logga in i staff-appen
2. Starta ett jobb (GPS modal visas)
3. Lägg till tjänster
4. Avsluta jobbet (ingen GPS modal)
5. Gå till CRM → Anställda → [Den anställde]
6. Se tidsrapporten!

## 📈 Fördelar:

- **Automatisk tidsrapportering** - Ingen manuell inmatning
- **GPS-verifiering** - Bekräftar att personal är på plats
- **Övertidshantering** - Automatisk beräkning
- **Realtidsöversikt** - Se vem som jobbar var just nu
- **Löneunderlag** - Exportera för lönesystem

## 🛠️ Nästa steg (valfritt):

1. **Löneexport** - Exportera tidsrapporter till lönesystem
2. **Godkännande-flöde** - Chefer godkänner övertid
3. **Statistik** - Dashboards för produktivitet
4. **Push-notiser** - När personal glömmer checka ut

Systemet är nu redo att användas! 🎉