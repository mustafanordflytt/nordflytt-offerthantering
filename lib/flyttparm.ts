// Flyttpärm service - Hanterar kundens samlade dokumentation

export interface Flyttparm {
  customerKey: string
  customerName: string
  customerEmail?: string
  createdAt: string
  bookings: FlyttparmBooking[]
}

export interface FlyttparmBooking {
  bookingNumber: string
  createdAt: string
  lastUpdated?: string
  services: any[]
  photos: any[]
  workTime: {
    totalHours: number
    totalMinutes: number
    sessions: WorkSession[]
  }
  additionalServices: any[]
}

export interface WorkSession {
  date: string
  hours: number
  minutes: number
  staff: string
}

// Hämta kundens flyttpärm
export const getCustomerFlyttparm = (bookingNumber: string): Flyttparm | null => {
  try {
    const flyttparmData = JSON.parse(localStorage.getItem('customer_flyttparm') || '{}')
    const customerKey = bookingNumber.split('-')[0] // Ex: NF2024123
    
    return flyttparmData[customerKey] || null
  } catch (error) {
    console.error('Error fetching flyttparm:', error)
    return null
  }
}

// Hämta specifik bokning från flyttpärm
export const getFlyttparmBooking = (bookingNumber: string): FlyttparmBooking | null => {
  const flyttparm = getCustomerFlyttparm(bookingNumber)
  if (!flyttparm) return null
  
  return flyttparm.bookings.find(b => b.bookingNumber === bookingNumber) || null
}

// Skapa URL för att visa flyttpärm (för kund)
export const generateFlyttparmUrl = (bookingNumber: string): string => {
  const customerKey = bookingNumber.split('-')[0]
  // I verkligheten skulle detta vara en säker URL med autentisering
  return `/flyttparm/${customerKey}`
}

// Exportera flyttpärm som PDF
export const exportFlyttparmAsPDF = async (bookingNumber: string): Promise<string> => {
  const flyttparm = getCustomerFlyttparm(bookingNumber)
  if (!flyttparm) throw new Error('Flyttpärm not found')
  
  // Mock PDF generation
  const pdfContent = `
    <h1>Flyttpärm - ${flyttparm.customerName}</h1>
    <h2>Bokningar</h2>
    ${flyttparm.bookings.map(booking => `
      <div>
        <h3>${booking.bookingNumber}</h3>
        <p>Total arbetstid: ${booking.workTime.totalHours}h ${booking.workTime.totalMinutes}m</p>
        <p>Antal foton: ${booking.photos.length}</p>
        <p>Senast uppdaterad: ${new Date(booking.lastUpdated || booking.createdAt).toLocaleDateString('sv-SE')}</p>
      </div>
    `).join('')}
  `
  
  return `data:application/pdf;base64,${btoa(pdfContent)}`
}

// Sammanfattning av flyttpärm
export const getFlyttparmSummary = (bookingNumber: string): {
  totalBookings: number
  totalPhotos: number
  totalWorkHours: number
  totalWorkMinutes: number
  lastActivity: string
} | null => {
  const flyttparm = getCustomerFlyttparm(bookingNumber)
  if (!flyttparm) return null
  
  let totalPhotos = 0
  let totalMinutes = 0
  let lastActivity = flyttparm.createdAt
  
  flyttparm.bookings.forEach(booking => {
    totalPhotos += booking.photos.length
    totalMinutes += (booking.workTime.totalHours * 60) + booking.workTime.totalMinutes
    
    if (booking.lastUpdated && booking.lastUpdated > lastActivity) {
      lastActivity = booking.lastUpdated
    }
  })
  
  return {
    totalBookings: flyttparm.bookings.length,
    totalPhotos,
    totalWorkHours: Math.floor(totalMinutes / 60),
    totalWorkMinutes: totalMinutes % 60,
    lastActivity
  }
}