# 📸 Sätt upp Supabase Storage för bilduppladdning

## 1. Konfigurera miljövariabler

Lägg till dessa i din `.env.local` fil:

```env
NEXT_PUBLIC_SUPABASE_URL=din-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
```

## 2. Kör migrationen

Kör SQL-filen i Supabase SQL Editor:

```sql
-- Kör innehållet från: supabase/migrations/20250116_create_job_photos.sql
```

## 3. Verifiera Storage Bucket

1. Gå till Storage i Supabase Dashboard
2. Kontrollera att bucket "job-photos" finns
3. Om inte, skapa den manuellt:
   - Name: `job-photos`
   - Public: `Yes` (för enkel åtkomst)

## 4. Testa uppladdning

1. Starta appen: `npm run dev`
2. Logga in som personal
3. Ta en bild i ett uppdrag
4. Kontrollera:
   - LocalStorage har bilden som backup
   - Supabase Storage har bilden uppladdad
   - job_photos tabellen har metadata

## 5. Felsökning

### "Bucket not found"
- Skapa bucket manuellt i Supabase Dashboard

### "Permission denied"
- Kontrollera RLS policies i SQL-migrationen
- Verifiera att anon key är korrekt

### "Failed to compress"
- Bilden kan vara för stor eller korrupt
- Max storlek efter komprimering: ~1MB

## 6. Offline-hantering

Om uppladdning misslyckas:
- Bilden sparas i localStorage
- Visar "Sparat lokalt" meddelande
- TODO: Implementera bakgrundssynk när online igen

## 7. Framtida förbättringar

- [ ] Automatisk bakgrundssynk för offline-bilder
- [ ] Progressiv uppladdning med statusindikator
- [ ] Bild-galleri i staff dashboard
- [ ] AI-analys av bilder (känna igen möbler etc)