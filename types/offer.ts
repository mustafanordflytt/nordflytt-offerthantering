export interface Service {
  name: string
  price: number
}

export interface TimelineItem {
  service: string
  startTime: string
  endTime: string
  personnel: number
  personnelType: string
}

export interface Offer {
  id: string
  customerName: string
  email?: string
  phone?: string
  services: Service[]
  totalPrice: number
  timeline: TimelineItem[]
  totalTime: number
  totalPersonnel: number
  expectedEndTime: string
}
