export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  offerStatus: string
}

export interface CRMOffer {
  id: string
  customerName: string
  sentDate: string
  status: string
  bookingDate: string | null
}
