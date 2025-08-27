import type { Offer, Service, TimelineItem } from "@/types/offer"

export async function getOfferById(id: string): Promise<Offer | null> {
  // TODO: Implement actual API call
  // This is a mock implementation
  const mockOffer: Offer = {
    id,
    customerName: "John Doe",
    services: [
      { name: "Flytthjälp", price: 5000 },
      { name: "Packhjälp", price: 3000 },
      { name: "Flyttstädning", price: 2500 },
    ],
    totalPrice: 9500,
    timeline: [
      { service: "Packhjälp", startTime: "08:00", endTime: "11:45", personnel: 3, personnelType: "packare" },
      { service: "Flytthjälp", startTime: "11:45", endTime: "14:50", personnel: 3, personnelType: "flyttpersonal" },
      { service: "Flyttstädning", startTime: "14:50", endTime: "18:05", personnel: 3, personnelType: "städare" },
    ],
    totalTime: 10,
    totalPersonnel: 9,
    expectedEndTime: "18:05",
  }

  return mockOffer
}

export function calculateOffer(
  area: number,
  services: string[],
  hasBalcony: boolean,
  hasAppliances: boolean,
  floors: number,
  parkingDistance: number,
): Offer {
  const personnelCount = getPersonnelCount(area)
  const timeline: TimelineItem[] = []
  let totalTime = 0
  let totalPrice = 0

  const selectedServices: Service[] = services.map((serviceName) => {
    let price = 0
    let time = 0

    switch (serviceName) {
      case "Packhjälp":
        time = area * 0.15
        price = time * 400 * personnelCount.packers
        timeline.push({
          service: "Packhjälp",
          startTime: formatTime(totalTime),
          endTime: formatTime(totalTime + time),
          personnel: personnelCount.packers,
          personnelType: "packare",
        })
        totalTime += time
        break
      case "Flytthjälp":
        const volume = area * 0.5 // Assuming 0.5 m³ per square meter
        time = volume * 0.4 + floors * 0.2 + parkingDistance * 0.03
        price = time * 500 * personnelCount.movers
        timeline.push({
          service: "Flytthjälp",
          startTime: formatTime(totalTime),
          endTime: formatTime(totalTime + time),
          personnel: personnelCount.movers,
          personnelType: "flyttpersonal",
        })
        totalTime += time
        break
      case "Flyttstädning":
        time = area * 0.12 + (hasBalcony ? 0.5 : 0) + (hasAppliances ? 0.3 : 0)
        price = time * 350 * personnelCount.cleaners
        timeline.push({
          service: "Flyttstädning",
          startTime: formatTime(totalTime),
          endTime: formatTime(totalTime + time),
          personnel: personnelCount.cleaners,
          personnelType: "städare",
        })
        totalTime += time
        break
    }

    return { name: serviceName, price: Math.round(price) }
  })

  totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0)

  return {
    id: "generated-id", // This should be generated or provided by the backend
    customerName: "Customer Name", // This should be provided when creating the offer
    services: selectedServices,
    totalPrice: Math.round(totalPrice * 0.7), // Applying RUT-avdrag
    timeline,
    totalTime: Math.round(totalTime * 10) / 10,
    totalPersonnel: personnelCount.packers + personnelCount.movers + personnelCount.cleaners,
    expectedEndTime: formatTime(totalTime),
  }
}

function getPersonnelCount(area: number) {
  if (area <= 55) return { packers: 2, movers: 2, cleaners: 2 }
  if (area <= 75) return { packers: 3, movers: 3, cleaners: 2 }
  if (area <= 100) return { packers: 3, movers: 3, cleaners: 3 }
  if (area <= 150) return { packers: 4, movers: 4, cleaners: 4 }
  return { packers: 5, movers: 5, cleaners: 5 }
}

function formatTime(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export async function bookOffer(offerId: string): Promise<void> {
  // TODO: Implement actual API call to book the offer
  console.log(`Booking offer with ID: ${offerId}`)
}

export async function submitFeedback(offerId: string, rating: number, comment: string): Promise<void> {
  // TODO: Implement actual API call to submit feedback
  console.log(`Submitting feedback for offer ${offerId}: Rating ${rating}, Comment: ${comment}`)
}

export async function getAnalyticsData() {
  // TODO: Implement actual API call to fetch analytics data
  return {
    offerBookingData: [
      { name: "Skickade", value: 100 },
      { name: "Öppnade", value: 80 },
      { name: "Bokade", value: 60 },
    ],
    customerSatisfactionData: [
      { name: "Jan", value: 4.2 },
      { name: "Feb", value: 4.5 },
      { name: "Mar", value: 4.7 },
      { name: "Apr", value: 4.8 },
      { name: "Maj", value: 4.9 },
    ],
    popularServicesData: [
      { name: "Flytthjälp", value: 80 },
      { name: "Packhjälp", value: 60 },
      { name: "Flyttstädning", value: 70 },
    ],
    revenueData: [
      { name: "Jan", value: 50000 },
      { name: "Feb", value: 60000 },
      { name: "Mar", value: 75000 },
      { name: "Apr", value: 90000 },
      { name: "Maj", value: 100000 },
    ],
  }
}
