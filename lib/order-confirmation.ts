// Order Confirmation Service - Rapportera bilder och arbetstid

export interface OrderConfirmationData {
  jobId: string
  bookingNumber: string
  customerName: string
  customerEmail?: string
  completedServices: ServiceReport[]
  totalWorkTime: WorkTimeReport
  additionalServices: AdditionalService[]
  photos: PhotoReport[]
  completedAt: string
  staffSignature: string
}

export interface ServiceReport {
  serviceType: string
  startTime: string
  endTime: string
  duration: number // minuter
  staff: string[]
  notes?: string
}

export interface WorkTimeReport {
  totalHours: number
  totalMinutes: number
  breakMinutes: number
  overtimeMinutes: number
  perService: {
    [key: string]: {
      hours: number
      minutes: number
    }
  }
}

export interface AdditionalService {
  type: 'parking' | 'stairs' | 'overtime' | 'materials' | 'other'
  description: string
  cost: number
  quantity?: number
  photo?: string // base64 eller URL
}

export interface PhotoReport {
  id: string
  category: 'before' | 'during' | 'after' | 'packing' | 'special' | 'damage' | 'additional'
  serviceType: string
  description: string
  timestamp: string
  location?: string
  gpsCoordinates?: {
    latitude: number
    longitude: number
  }
  url: string // base64 eller URL till bilden
}

// Kategorisera foton baserat på innehåll och timing
export const categorizePhoto = (
  photo: any,
  jobStartTime: Date,
  jobEndTime?: Date
): PhotoReport['category'] => {
  const photoTime = new Date(photo.timestamp)
  
  // Baserat på timing
  if (jobEndTime && photoTime > jobEndTime) {
    return 'after'
  }
  
  if (photoTime < new Date(jobStartTime.getTime() + 30 * 60000)) { // Inom 30 min från start
    return 'before'
  }
  
  // Baserat på nyckelord i beskrivning eller rum
  const description = (photo.room || '').toLowerCase()
  if (description.includes('kartong') || description.includes('packning')) {
    return 'packing'
  }
  if (description.includes('skada') || description.includes('damage')) {
    return 'damage'
  }
  if (description.includes('tillägg') || description.includes('extra')) {
    return 'additional'
  }
  
  return 'during'
}

// Sammanställ orderbekräftelse från jobbdata
export const compileOrderConfirmation = async (
  jobId: string,
  jobData: any
): Promise<OrderConfirmationData> => {
  // Hämta tidsloggar
  const timeEntries = JSON.parse(localStorage.getItem('time_entries') || '[]')
  const jobTimeEntries = timeEntries.filter((entry: any) => entry.jobId === jobId)
  
  // Hämta foton
  const allPhotos = JSON.parse(localStorage.getItem('photos') || '[]')
  const jobPhotos = allPhotos.filter((photo: any) => 
    photo.timestamp && jobTimeEntries.some((entry: any) => 
      new Date(photo.timestamp) >= new Date(entry.startTime) &&
      (!entry.endTime || new Date(photo.timestamp) <= new Date(entry.endTime))
    )
  )
  
  // Beräkna total arbetstid
  const totalWorkTime = calculateTotalWorkTime(jobTimeEntries)
  
  // Skapa service rapporter
  const completedServices = jobTimeEntries.map((entry: any) => ({
    serviceType: entry.serviceType,
    startTime: entry.startTime,
    endTime: entry.endTime || new Date().toISOString(),
    duration: entry.duration || calculateDuration(entry.startTime, entry.endTime),
    staff: jobData.teamMembers || [],
    notes: entry.notes
  }))
  
  // Kategorisera och formatera foton
  const jobStartTime = new Date(Math.min(...jobTimeEntries.map((e: any) => new Date(e.startTime).getTime())))
  const jobEndTime = jobTimeEntries.every((e: any) => e.endTime) 
    ? new Date(Math.max(...jobTimeEntries.map((e: any) => new Date(e.endTime).getTime())))
    : undefined
    
  const photoReports: PhotoReport[] = jobPhotos.map((photo: any) => ({
    id: photo.id || `photo_${Date.now()}_${Math.random()}`,
    category: categorizePhoto(photo, jobStartTime, jobEndTime),
    serviceType: photo.serviceType || 'Allmänt',
    description: photo.room || 'Dokumentation',
    timestamp: photo.timestamp,
    location: photo.gpsText,
    gpsCoordinates: photo.gpsPosition,
    url: photo.dataUrl || photo.url
  }))
  
  // Identifiera tilläggstjänster från foton och data
  const additionalServices = identifyAdditionalServices(jobData, photoReports)
  
  return {
    jobId,
    bookingNumber: jobData.bookingNumber,
    customerName: jobData.customerName,
    customerEmail: jobData.customerEmail,
    completedServices,
    totalWorkTime,
    additionalServices,
    photos: photoReports,
    completedAt: new Date().toISOString(),
    staffSignature: jobData.teamMembers?.[0] || 'Personal'
  }
}

// Beräkna total arbetstid
const calculateTotalWorkTime = (timeEntries: any[]): WorkTimeReport => {
  let totalMinutes = 0
  const perService: { [key: string]: number } = {}
  
  timeEntries.forEach(entry => {
    const duration = entry.duration || calculateDuration(entry.startTime, entry.endTime)
    totalMinutes += duration
    
    if (!perService[entry.serviceType]) {
      perService[entry.serviceType] = 0
    }
    perService[entry.serviceType] += duration
  })
  
  // Konvertera till timmar och minuter
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  // Beräkna övertid (om total tid > beräknad tid)
  const overtimeMinutes = Math.max(0, totalMinutes - 480) // 8 timmar standard
  
  return {
    totalHours: hours,
    totalMinutes: minutes,
    breakMinutes: 0, // Kan läggas till senare
    overtimeMinutes,
    perService: Object.entries(perService).reduce((acc, [service, mins]) => ({
      ...acc,
      [service]: {
        hours: Math.floor(mins / 60),
        minutes: mins % 60
      }
    }), {})
  }
}

// Beräkna duration i minuter
const calculateDuration = (startTime: string, endTime?: string): number => {
  if (!endTime) return 0
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  return Math.round((end - start) / 60000)
}

// Identifiera tilläggstjänster
const identifyAdditionalServices = (jobData: any, photos: PhotoReport[]): AdditionalService[] => {
  const services: AdditionalService[] = []
  
  // Parkering
  if (jobData.locationInfo?.parkingDistance > 5) {
    const extraMeters = jobData.locationInfo.parkingDistance - 5
    services.push({
      type: 'parking',
      description: `Parkering ${jobData.locationInfo.parkingDistance}m från entrén`,
      cost: extraMeters * 99,
      quantity: extraMeters,
      photo: photos.find(p => p.description.toLowerCase().includes('parkering'))?.url
    })
  }
  
  // Trappor
  if (!jobData.locationInfo?.elevator && jobData.locationInfo?.floor > 2) {
    services.push({
      type: 'stairs',
      description: `Trappbärning våning ${jobData.locationInfo.floor} utan hiss`,
      cost: 500,
      quantity: jobData.locationInfo.floor - 2,
      photo: photos.find(p => p.description.toLowerCase().includes('trapp'))?.url
    })
  }
  
  // Material från foton
  const packingPhotos = photos.filter(p => p.category === 'packing')
  if (packingPhotos.length > 0) {
    services.push({
      type: 'materials',
      description: 'Packmaterial använt enligt fotodokumentation',
      cost: 299, // Exempelkostnad
      photo: packingPhotos[0].url
    })
  }
  
  return services
}

// Lägg till data till befintlig orderbekräftelse i flyttpärmen
export const appendToExistingOrderConfirmation = async (
  confirmationData: OrderConfirmationData
): Promise<{ success: boolean, message: string }> => {
  try {
    // Hämta befintlig flyttpärm för kunden
    const flyttparm = JSON.parse(localStorage.getItem('customer_flyttparm') || '{}')
    const customerKey = confirmationData.bookingNumber.split('-')[0] // Ex: NF2024123
    
    if (!flyttparm[customerKey]) {
      flyttparm[customerKey] = {
        customerName: confirmationData.customerName,
        customerEmail: confirmationData.customerEmail,
        createdAt: new Date().toISOString(),
        bookings: []
      }
    }
    
    // Hitta befintlig orderbekräftelse eller skapa ny
    let existingBooking = flyttparm[customerKey].bookings.find(
      (booking: any) => booking.bookingNumber === confirmationData.bookingNumber
    )
    
    if (!existingBooking) {
      existingBooking = {
        bookingNumber: confirmationData.bookingNumber,
        createdAt: new Date().toISOString(),
        services: [],
        photos: [],
        workTime: { totalHours: 0, totalMinutes: 0, sessions: [] },
        additionalServices: []
      }
      flyttparm[customerKey].bookings.push(existingBooking)
    }
    
    // Lägg till nya tjänster
    existingBooking.services.push(...confirmationData.completedServices)
    
    // Lägg till nya foton
    existingBooking.photos.push(...confirmationData.photos)
    
    // Uppdatera total arbetstid
    const totalMinutes = (existingBooking.workTime.totalHours * 60 + existingBooking.workTime.totalMinutes) +
                        (confirmationData.totalWorkTime.totalHours * 60 + confirmationData.totalWorkTime.totalMinutes)
    existingBooking.workTime.totalHours = Math.floor(totalMinutes / 60)
    existingBooking.workTime.totalMinutes = totalMinutes % 60
    existingBooking.workTime.sessions.push({
      date: new Date().toISOString(),
      hours: confirmationData.totalWorkTime.totalHours,
      minutes: confirmationData.totalWorkTime.totalMinutes,
      staff: confirmationData.staffSignature
    })
    
    // Lägg till tilläggstjänster
    existingBooking.additionalServices.push(...confirmationData.additionalServices)
    
    // Uppdatera senaste aktivitet
    existingBooking.lastUpdated = new Date().toISOString()
    
    // Spara uppdaterad flyttpärm
    localStorage.setItem('customer_flyttparm', JSON.stringify(flyttparm))
    
    // Spara även som separat orderbekräftelse för historik
    const confirmations = JSON.parse(localStorage.getItem('order_confirmations') || '[]')
    confirmations.push({
      ...confirmationData,
      appendedToFlyttparm: true,
      appendedAt: new Date().toISOString()
    })
    localStorage.setItem('order_confirmations', JSON.stringify(confirmations))
    
    return {
      success: true,
      message: `✅ Orderbekräftelse tillagd i flyttpärmen!\n\n📁 Bokningsnummer: ${confirmationData.bookingNumber}\n📷 ${confirmationData.photos.length} nya bilder\n⏱️ Arbetstid denna session: ${confirmationData.totalWorkTime.totalHours}h ${confirmationData.totalWorkTime.totalMinutes}m\n\n💡 Kunden kan se alla uppdateringar i sin flyttpärm.`
    }
  } catch (error) {
    console.error('Error appending to order confirmation:', error)
    return {
      success: false,
      message: '❌ Kunde inte uppdatera flyttpärmen. Försök igen.'
    }
  }
}

// Skicka orderbekräftelse (mock för demo) - behålls för bakåtkompabilitet
export const sendOrderConfirmation = async (
  confirmationData: OrderConfirmationData,
  recipientEmail?: string
): Promise<{ success: boolean, message: string }> => {
  // Använd append-funktionen istället
  return appendToExistingOrderConfirmation(confirmationData)
}

// Generera PDF-rapport (mock för demo)
export const generateOrderConfirmationPDF = async (
  confirmationData: OrderConfirmationData
): Promise<string> => {
  // I verkligheten skulle detta använda en PDF-generator
  // För demo returnerar vi en data URL
  const pdfContent = `
    <h1>Orderbekräftelse - ${confirmationData.bookingNumber}</h1>
    <p>Kund: ${confirmationData.customerName}</p>
    <p>Datum: ${new Date(confirmationData.completedAt).toLocaleDateString('sv-SE')}</p>
    <h2>Utförda tjänster</h2>
    ${confirmationData.completedServices.map(s => 
      `<p>${s.serviceType}: ${Math.floor(s.duration / 60)}h ${s.duration % 60}m</p>`
    ).join('')}
    <h2>Total arbetstid</h2>
    <p>${confirmationData.totalWorkTime.totalHours}h ${confirmationData.totalWorkTime.totalMinutes}m</p>
    <h2>Fotodokumentation</h2>
    <p>${confirmationData.photos.length} bilder bifogade</p>
  `
  
  return `data:application/pdf;base64,${btoa(pdfContent)}`
}