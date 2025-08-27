# 🔧 Fix för Tilläggstjänster - Staff App → Faktura

## 🚨 KRITISKT PROBLEM
Tilläggstjänster som läggs till i Staff App försvinner och kommer inte med på bekräftelse eller faktura!

## 📊 Nuvarande situation

### Staff App har dessa tilläggstjänster:
- **Tunga lyft**: 1000-2000 kr
- **Packning**: 200-250 kr per enhet
- **Återvinning**: 250-1000 kr
- **Extra städ**: 500 kr/timme
- **Parkering**: 99 kr/meter
- **Volymjustering**: 240 kr/m³
- **Material**: 20-99 kr

### Problem:
1. Data sparas bara i React state (försvinner vid refresh)
2. Ingen koppling till databas
3. Bekräftelsesidan kan inte se tillägg
4. Fakturan får inte med tillägg

## 🛠️ Lösning (2-3 dagar arbete)

### Steg 1: Skapa databastabeller
```sql
-- Lägg till i jobs-tabellen
ALTER TABLE jobs ADD COLUMN added_services JSONB DEFAULT '[]';
ALTER TABLE jobs ADD COLUMN updated_price DECIMAL(10,2);

-- Eller skapa separat tabell
CREATE TABLE job_additional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  service_id VARCHAR(100),
  service_name VARCHAR(255),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  added_by VARCHAR(255),
  added_at TIMESTAMP DEFAULT NOW(),
  photo_url TEXT,
  notes TEXT
);
```

### Steg 2: Uppdatera Staff App API
```typescript
// /app/api/staff/add-service-to-order/route.ts
export async function POST(request: Request) {
  const { jobId, services } = await request.json()
  
  // Spara i Supabase
  const { data, error } = await supabase
    .from('job_additional_services')
    .insert(services.map(service => ({
      job_id: jobId,
      service_id: service.id,
      service_name: service.name,
      quantity: service.quantity,
      unit_price: service.price,
      total_price: service.price * service.quantity,
      added_by: service.addedBy
    })))
  
  // Uppdatera totalpris på jobbet
  await supabase
    .from('jobs')
    .update({ 
      updated_price: originalPrice + totalAddedServices 
    })
    .eq('id', jobId)
    
  return NextResponse.json({ success: true })
}
```

### Steg 3: Uppdatera Bekräftelsesidan
```typescript
// /app/order-confirmation/[id]/page.tsx
// Lägg till i getOrderData
const { data: additionalServices } = await supabase
  .from('job_additional_services')
  .select('*')
  .eq('job_id', jobId)

// Visa i UI
{additionalServices && additionalServices.length > 0 && (
  <div className="mt-6">
    <h3>Tillagda tjänster</h3>
    {additionalServices.map(service => (
      <div key={service.id}>
        {service.service_name} x{service.quantity} = {service.total_price} kr
      </div>
    ))}
  </div>
)}
```

### Steg 4: Uppdatera Fakturagenereringen
```typescript
// /app/api/generate-invoice/route.ts
// Hämta tilläggstjänster från databas
const { data: additionalServices } = await supabase
  .from('job_additional_services')
  .select('*')
  .eq('job_id', jobId)

// Lägg till på fakturan
for (const service of additionalServices) {
  invoiceRows.push({
    articleNumber: '99',
    description: service.service_name,
    quantity: service.quantity,
    price: service.unit_price,
    vatRate: 25,
    houseworkType: 'MOVINGSERVICES',
    rutEligible: true
  })
}
```

## ⚡ Snabbfix (1 dag)
Om ni behöver en temporär lösning:

1. Spara i localStorage med jobId som nyckel
2. Läs från localStorage i bekräftelsesidan
3. Skicka med i headers till faktura-API:n

```javascript
// Staff App
localStorage.setItem(`job-${jobId}-services`, JSON.stringify(addedServices))

// Bekräftelsesida
const savedServices = localStorage.getItem(`job-${jobId}-services`)

// Faktura API
const services = JSON.parse(request.headers.get('X-Additional-Services') || '[]')
```

## 🎯 Rekommendation
Implementera den permanenta lösningen direkt. Det tar bara 2-3 dagar och ger er:
- Persistent data
- Rapporteringsmöjligheter
- Revision trail
- Bättre kundupplevelse

Detta är KRITISKT för att kunna fakturera korrekt!