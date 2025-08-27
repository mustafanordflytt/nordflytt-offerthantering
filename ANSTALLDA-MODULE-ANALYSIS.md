# 📋 Anställda-modul Analys & Produktionskrav

## 📊 Nuvarande Status (43% Produktionsredo)

### ✅ Vad som fungerar:
1. **Personal översikt (KPI Dashboard)**
   - Total Personal: 7 anställda (6 avdelningar)
   - Tillgängliga: 4 (57% av personal)
   - Upptagna: 1 (Aktiva uppdrag)
   - Snittbetyg: 4.1
   - Slutförda Jobb: 934 total produktivitet

2. **Personal lista**
   - Visar namn, roll, status, betyg, slutförda jobb
   - Kontaktinformation (email, telefon)
   - Avdelningar/roller
   - Åtgärder per anställd (telefon, email ikoner)

3. **Filtrering & Sökning**
   - Sökfält för namn, email eller telefon
   - Filter för roller
   - Filter för status  
   - Filter för avdelningar

4. **Roller & Status**
   - Administratör, Chef, Kundtjänst, Chaufför, Flyttledare, Flyttpersonal
   - Status: Tillgänglig, Upptagen, Ledig

5. **"Ny Anställd" knapp**
   - Finns och synlig
   - Navigerar troligen till formulär

### ❌ Vad som saknas för produktion:

#### 1. **Schemaläggning & Kalender** 🗓️
- Vecko/månadsvy för personal
- Tillgänglighet per dag/timme
- Semesterplanering
- Sjukfrånvaro
- Integration med uppdragsmodulen

#### 2. **Tidrapportering** ⏰
- Stämpelklocka (in/ut)
- Arbetstid per uppdrag
- Övertidsberäkning
- Raster och pauser
- Export till lönesystem

#### 3. **Dokumenthantering** 📄
- Anställningsavtal
- ID-handlingar
- Körkort & certifikat
- Utbildningsintyg
- Polisregister
- Utgångsdatum för dokument

#### 4. **Kompetenshantering** 🎯
- Detaljerad kompetensprofil
- Certifieringar (YKB, truckkort, etc.)
- Utbildningshistorik
- Planerade utbildningar
- Kompetensgap-analys

#### 5. **Prestationsuppföljning** 📈
- Individuella KPI:er
- Kundbetyg per anställd
- Produktivitetsstatistik
- Förbättringsområden
- Bonusunderlag

#### 6. **Kommunikation & Notifieringar** 💬
- Intern meddelandefunktion
- Push-notiser för schemaändringar
- Gruppmeddelanden per team
- Nyhetsflöde

#### 7. **Onboarding & Offboarding** 👋
- Checklistor för nyanställda
- Utrustningshantering
- Åtkomsthantering
- Avslutningsprocess

#### 8. **Löne & Förmåner** 💰
- Lönespecifikationer
- Förmånsöversikt
- Pensionsinformation
- Försäkringar

## 🏗️ Implementation Roadmap

### Fas 1: Grundläggande funktionalitet (1-2 veckor)
1. ✅ Personal översikt (KLAR)
2. ✅ Lista & filtrering (KLAR)
3. ⚠️  API integration (delvis klar)
4. ❌ CRUD operationer (Skapa, Uppdatera, Ta bort)
5. ❌ Detaljvy för anställd

### Fas 2: Schemaläggning (2-3 veckor)
1. Kalenderintegration
2. Tillgänglighetshantering
3. Koppling till uppdrag
4. Konflikthantering

### Fas 3: Tidrapportering (2 veckor)
1. Digital stämpelklocka
2. Projektbaserad tid
3. Rapporter & export
4. Godkännandeflöde

### Fas 4: Dokument & Kompetens (2 veckor)
1. Dokumentuppladdning
2. Utgångsdatumvarningar
3. Kompetensmatris
4. Utbildningsplanering

### Fas 5: Avancerade funktioner (3-4 veckor)
1. Prestationsuppföljning
2. Kommunikationssystem
3. Onboarding-flöden
4. Integrationer (lönesystem, etc.)

## 💻 Tekniska krav

### API Endpoints som behövs:
```typescript
GET    /api/crm/staff              ✅ Finns (behöver förbättras)
GET    /api/crm/staff/[id]         ❌ Saknas
POST   /api/crm/staff              ❌ Saknas
PUT    /api/crm/staff/[id]         ❌ Saknas
DELETE /api/crm/staff/[id]         ❌ Saknas
GET    /api/crm/staff/[id]/schedule ❌ Saknas
POST   /api/crm/staff/[id]/timesheet ❌ Saknas
GET    /api/crm/staff/[id]/documents ❌ Saknas
```

### Databasschema:
```sql
-- Behövs utöver befintlig staff-tabell:
staff_schedule (schemaläggning)
staff_timesheet (tidrapporter)
staff_documents (dokument)
staff_skills (kompetenser)
staff_performance (prestationer)
staff_notifications (notifieringar)
```

## 🎯 Prioriterade åtgärder för MVP

1. **Komplettera API** (Högsta prioritet)
   - CRUD operationer för personal
   - Detaljvy endpoint
   - Bättre felhantering

2. **Detaljvy för anställd**
   - Personlig information
   - Kontaktuppgifter
   - Aktuella uppdrag
   - Historik

3. **Grundläggande schemaläggning**
   - Tillgänglighet per dag
   - Koppling till uppdrag
   - Enkel kalendervy

4. **Dokumenthantering (kritiskt)**
   - Körkort & certifikat
   - Utgångsdatumvarningar
   - Säker lagring

## 🚀 Rekommendation

För att göra modulen produktionsredo behövs minst:
- ✅ Fungerande CRUD operationer
- ✅ Personaldetaljer med fullständig information
- ✅ Grundläggande schemaläggning
- ✅ Dokumenthantering för kritiska dokument
- ✅ Integration med uppdragsmodulen

**Estimerad tid för MVP: 2-3 veckor**
**Estimerad tid för full funktionalitet: 8-10 veckor**

---
**Analyserad**: 2025-01-06
**Nuvarande status**: 43% produktionsredo
**Rekommendation**: Fokusera på MVP-funktioner först