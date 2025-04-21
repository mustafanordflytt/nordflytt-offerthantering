export type CustomerType = "private" | "business"

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  address?: string
}

export interface MoveDetails {
  moveType: "local" | "distance" | "international"
  startAddress: string
  endAddress: string
  moveDate?: string
  moveSize: "small" | "medium" | "large" | "office"
  floors: {
    start: number
    end: number
  }
  elevator: {
    start: boolean
    end: boolean
  }
  parkingDistance: {
    start: number
    end: number
  }
  hasBalcony?: boolean
}

export interface InventoryItem {
  name: string
  quantity: number
  size?: "small" | "medium" | "large"
}

export interface Inventory {
  items: InventoryItem[]
  totalVolume?: number
}

export interface AdditionalService {
  id: string
  name: string
  price: number
  selected: boolean
}

export interface FormData {
  customerType: CustomerType
  customerInfo: CustomerInfo
  moveDetails: MoveDetails
  inventory: Inventory
  services: string[]
  additionalServices: AdditionalService[]
  totalPrice: number
  step: number
}

export interface QuoteSubmission {
  customerType: CustomerType
  customerInfo: CustomerInfo
  moveDetails: MoveDetails
  inventory: Inventory
  services: string[]
  additionalServices: AdditionalService[]
  totalPrice: number
}
