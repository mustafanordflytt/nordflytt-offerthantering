# Uppdatera Fortnox-integration för Tilläggstjänster från Databas

## Problem
Fortnox-integrationen läser tilläggstjänster från `completionData.additions`, men vi behöver hämta dem från Supabase-databasen istället.

## Lösning

### 1. Uppdatera JobCompletionData interface (i `/lib/fortnox-integration.ts`):
```typescript
interface JobCompletionData {
  actualHours: Record<string, number>;
  additions: Array<{
    description: string;
    price: number;
    rutEligible: boolean;
    quantity?: number;
    serviceId?: string;
  }>;
  materials: Array<{
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  staffBreakdown: Record<string, any[]>;
  jobId?: string; // Lägg till för att kunna hämta från databas
}
```

### 2. Skapa en hjälpfunktion för att hämta tilläggstjänster:
```typescript
// Lägg till i fortnox-integration.ts
private async fetchAdditionalServicesFromDB(jobId: string): Promise<any[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data, error } = await supabase
    .from('job_additional_services')
    .select('*')
    .eq('job_id', jobId)
  
  if (error) {
    console.error('Error fetching additional services:', error)
    return []
  }
  
  return data || []
}
```

### 3. Uppdatera buildInvoice för att hämta från databas:
```typescript
private async buildInvoice(
  jobData: CRMJobData,
  completionData: JobCompletionData,
  customerNumber: string
): Promise<FortnoxInvoice> {
  const invoiceRows: FortnoxInvoiceRow[] = [];

  // ... (existing main services code) ...

  // Hämta tilläggstjänster från databas om jobId finns
  let additionalServices = completionData.additions || [];
  
  if (completionData.jobId) {
    const dbServices = await this.fetchAdditionalServicesFromDB(completionData.jobId);
    
    // Konvertera från databas-format till additions-format
    additionalServices = dbServices.map(service => ({
      description: service.service_name,
      price: parseFloat(service.total_price),
      rutEligible: service.rut_eligible,
      quantity: service.quantity
    }));
  }

  // Add additional services
  for (const addition of additionalServices) {
    invoiceRows.push({
      articleNumber: '99', // Generic additional service
      description: addition.description,
      quantity: addition.quantity || 1,
      price: addition.price,
      vatRate: 25,
      houseworkType: 'MOVINGSERVICES',
      rutEligible: addition.rutEligible
    });
  }

  // ... (rest of the function remains the same) ...
}
```

### 4. Uppdatera API endpoint som kallar på Fortnox:
```typescript
// I /app/api/generate-invoice/route.ts eller liknande
const completionData = {
  actualHours: actualHours,
  additions: [], // Tom array, vi hämtar från DB istället
  materials: materials,
  staffBreakdown: staffBreakdown,
  jobId: jobId // Skicka med jobId
}
```

### 5. Alternativ: Hämta allt direkt i API:n innan Fortnox anropas
```typescript
// I API endpoint som genererar faktura
const { data: additionalServices } = await supabase
  .from('job_additional_services')
  .select('*')
  .eq('job_id', jobId)

const completionData = {
  actualHours: actualHours,
  additions: additionalServices.map(s => ({
    description: s.service_name,
    price: parseFloat(s.total_price),
    rutEligible: s.rut_eligible,
    quantity: s.quantity
  })),
  materials: materials,
  staffBreakdown: staffBreakdown
}
```

## Viktigt att tänka på:
1. Se till att jobId alltid skickas med när faktura genereras
2. Hantera fel om databashämtning misslyckas
3. Testa att RUT-avdrag beräknas korrekt för tilläggstjänster
4. Verifiera att alla tilläggstjänster kommer med på fakturan