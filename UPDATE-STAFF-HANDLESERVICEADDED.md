# Uppdatera handleServiceAdded i Staff App

## Ersätt handleServiceAdded funktionen (rad 536-627) med:

```typescript
const handleServiceAdded = useCallback(async (services: any[]) => {
  if (!selectedJobForService) return
  
  console.log('handleServiceAdded called with:', {
    jobId: selectedJobForService.id,
    services: services,
    servicesCount: services.length
  })
  
  try {
    // Visa loading state
    setLoadingAction('adding-services')
    
    // Anropa den uppdaterade API:n som sparar i Supabase
    const response = await fetch('/api/staff/add-service-to-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId: selectedJobForService.id,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          category: service.category,
          price: service.price,
          quantity: service.quantity || 1,
          unit: service.unit,
          rutEligible: service.rutEligible !== false,
          photoUrl: service.photoUrl,
          notes: service.notes
        })),
        staffName: staff?.name || 'Personal',
        staffId: staff?.id
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to add services')
    }
    
    const result = await response.json()
    console.log('Services added successfully:', result)
    
    // Uppdatera lokal state med data från servern
    const addedServices = result.services.map((service: any) => ({
      id: service.id,
      serviceId: service.service_id,
      name: service.service_name,
      quantity: service.quantity,
      price: service.unit_price,
      totalPrice: service.total_price,
      addedAt: service.added_at,
      addedBy: service.added_by
    }))
    
    // Uppdatera jobbet i todaysJobs
    setTodaysJobs(prev => prev.map(job => {
      if (job.id === selectedJobForService.id) {
        return {
          ...job,
          addedServices: [...(job.addedServices || []), ...addedServices],
          totalAdditionalCost: result.totalAddedCost,
          updatedPrice: result.newTotalPrice
        }
      }
      return job
    }))
    
    // Uppdatera allJobs också
    setAllJobs(prev => prev.map(job => {
      if (job.id === selectedJobForService.id) {
        return {
          ...job,
          addedServices: [...(job.addedServices || []), ...addedServices],
          totalAdditionalCost: result.totalAddedCost,
          updatedPrice: result.newTotalPrice
        }
      }
      return job
    }))
    
    // Visa bekräftelse
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top'
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Tjänster tillagda! (+${result.totalAddedCost} kr)</span>
      </div>
      <div class="text-sm mt-1">Kund har notifierats via SMS & Email</div>
    `
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 5000)
    
    // Stäng modal
    setShowAddServiceModal(false)
    setSelectedJobForService(null)
    
  } catch (error) {
    console.error('Error adding services:', error)
    
    // Visa felmeddelande
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top'
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span>Kunde inte lägga till tjänster</span>
      </div>
    `
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
    
  } finally {
    setLoadingAction(null)
  }
}, [selectedJobForService, staff])
```

## Lägg också till i imports överst i filen:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Och lägg till loading state i UI:

```typescript
// I return-delen där modalen visas
{showAddServiceModal && selectedJobForService && (
  <AddServiceModal
    job={selectedJobForService}
    onClose={() => {
      setShowAddServiceModal(false)
      setSelectedJobForService(null)
    }}
    onServiceAdded={handleServiceAdded}
    isLoading={loadingAction === 'adding-services'}
  />
)}
```