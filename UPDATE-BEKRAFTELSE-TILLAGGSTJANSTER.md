# Uppdatera Bekräftelsesidan för Tilläggstjänster

## 1. Lägg till i imports:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 2. Lägg till state för tilläggstjänster:
```typescript
const [additionalServices, setAdditionalServices] = useState<any[]>([])
const [totalWithAdditions, setTotalWithAdditions] = useState(0)
```

## 3. I useEffect där order laddas, lägg till:
```typescript
// Efter att order har laddats
if (order && order.jobId) {
  // Hämta tilläggstjänster från databasen
  const { data: services, error } = await supabase
    .from('job_additional_services')
    .select('*')
    .eq('job_id', order.jobId)
    .order('added_at', { ascending: true })
  
  if (!error && services) {
    setAdditionalServices(services)
    
    // Beräkna total med tillägg
    const additionsTotal = services.reduce((sum, service) => 
      sum + parseFloat(service.total_price), 0
    )
    setTotalWithAdditions(order.totalPrice + additionsTotal)
  }
}
```

## 4. I render-delen, lägg till sektion för tilläggstjänster:
```typescript
{/* Efter den vanliga prissummeringen */}
{additionalServices.length > 0 && (
  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
    <h3 className="font-semibold text-lg mb-3 flex items-center">
      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Tillagda tjänster under flytt
    </h3>
    
    <div className="space-y-2">
      {additionalServices.map((service, index) => (
        <div key={service.id} className="flex justify-between items-center py-2 border-b border-blue-100 last:border-0">
          <div>
            <span className="font-medium">{service.service_name}</span>
            {service.quantity > 1 && (
              <span className="text-sm text-gray-600 ml-2">
                ({service.quantity} {service.unit || 'st'})
              </span>
            )}
            <div className="text-xs text-gray-500">
              Tillagd av {service.added_by} • {new Date(service.added_at).toLocaleString('sv-SE')}
            </div>
          </div>
          <span className="font-semibold">{service.total_price} kr</span>
        </div>
      ))}
    </div>
    
    <div className="mt-3 pt-3 border-t border-blue-200">
      <div className="flex justify-between items-center">
        <span className="font-semibold">Totalt tillägg:</span>
        <span className="font-bold text-lg">
          {additionalServices.reduce((sum, s) => sum + parseFloat(s.total_price), 0)} kr
        </span>
      </div>
    </div>
  </div>
)}

{/* Uppdatera totalsumman */}
<div className="mt-6 p-4 bg-gray-100 rounded-lg">
  <div className="flex justify-between items-center text-lg font-bold">
    <span>Total kostnad:</span>
    <span className="text-2xl">
      {additionalServices.length > 0 ? totalWithAdditions : order.totalPrice} kr
    </span>
  </div>
  {order.rutDeduction > 0 && (
    <p className="text-sm text-gray-600 mt-1">
      (inkl. RUT-avdrag på {order.rutDeduction} kr)
    </p>
  )}
</div>
```

## 5. Om du har en "Redigera tjänster" modal, uppdatera den:
```typescript
const handleUpdateServices = async () => {
  // Här kan du implementera redigering av tilläggstjänster
  // T.ex. ta bort eller lägga till fler
  console.log('Update services functionality')
}
```

## Alternativ: Enkel implementation med localStorage (snabbfix)
Om du vill testa snabbt innan Supabase är klart:

```typescript
// I useEffect
const savedServices = localStorage.getItem(`job-${order.jobId}-services`)
if (savedServices) {
  setAdditionalServices(JSON.parse(savedServices))
}
```