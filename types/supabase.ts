export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          name: string
          email: string
          phone: string
          customer_type: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          name: string
          email: string
          phone: string
          customer_type: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          name?: string
          email?: string
          phone?: string
          customer_type?: string
          notes?: string | null
        }
      }
      quotes: {
        Row: {
          id: string
          customer_id: string
          services: string[]
          value: number
          status: string
          created_at: string
          updated_at: string | null
          valid_until: string | null
          details: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          services: string[]
          value: number
          status: string
          created_at?: string
          updated_at?: string | null
          valid_until?: string | null
          details?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          services?: string[]
          value?: number
          status?: string
          created_at?: string
          updated_at?: string | null
          valid_until?: string | null
          details?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          customer_id: string
          service_type: string
          service_types: string[]
          move_date: string
          move_time: string
          start_address: string
          end_address: string
          status: string
          total_price: number
          reference: string
          details: {
            startAddress: string
            endAddress: string
            startFloor: string
            endFloor: string
            startElevator: string
            endElevator: string
            startParkingDistance: string
            endParkingDistance: string
            startLivingArea: string
            endLivingArea: string
            startPropertyType: string
            endPropertyType: string
            startDoorCode: string
            endDoorCode: string
            calculatedDistance: string
            movingBoxes: number
            largeItems: string[]
            specialItems: string[]
            packingService: string
            cleaningService: string
            additionalServices: string[]
            specialInstructions: string
            paymentMethod: string
            estimatedVolume: number
            needsMovingBoxes: boolean
          }
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          customer_id: string
          service_type: string
          service_types: string[]
          move_date: string
          move_time: string
          start_address: string
          end_address: string
          status: string
          total_price: number
          reference?: string
          details: {
            startAddress: string
            endAddress: string
            startFloor: string
            endFloor: string
            startElevator: string
            endElevator: string
            startParkingDistance: string
            endParkingDistance: string
            startLivingArea: string
            endLivingArea: string
            startPropertyType: string
            endPropertyType: string
            startDoorCode: string
            endDoorCode: string
            calculatedDistance: string
            movingBoxes: number
            largeItems: string[]
            specialItems: string[]
            packingService: string
            cleaningService: string
            additionalServices: string[]
            specialInstructions: string
            paymentMethod: string
            estimatedVolume: number
            needsMovingBoxes: boolean
          }
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          customer_id?: string
          service_type?: string
          service_types?: string[]
          move_date?: string
          move_time?: string
          start_address?: string
          end_address?: string
          status?: string
          total_price?: number
          reference?: string
          details?: {
            startAddress: string
            endAddress: string
            startFloor: string
            endFloor: string
            startElevator: string
            endElevator: string
            startParkingDistance: string
            endParkingDistance: string
            startLivingArea: string
            endLivingArea: string
            startPropertyType: string
            endPropertyType: string
            startDoorCode: string
            endDoorCode: string
            calculatedDistance: string
            movingBoxes: number
            largeItems: string[]
            specialItems: string[]
            packingService: string
            cleaningService: string
            additionalServices: string[]
            specialInstructions: string
            paymentMethod: string
            estimatedVolume: number
            needsMovingBoxes: boolean
          }
        }
      }
      reviews: {
        Row: {
          id: string
          created_at: string
          booking_id: string
          rating: number
          comment: string | null
          from_address: string
          to_address: string
          customer_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          booking_id: string
          rating: number
          comment?: string | null
          from_address: string
          to_address: string
          customer_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          booking_id?: string
          rating?: number
          comment?: string | null
          from_address?: string
          to_address?: string
          customer_id?: string | null
        }
      }
      follow_ups: {
        Row: {
          id: string
          created_at: string
          booking_id: string
          review_requested_at: string | null
          review_sent_at: string | null
          follow_up_sent_at: string | null
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          booking_id: string
          review_requested_at?: string | null
          review_sent_at?: string | null
          follow_up_sent_at?: string | null
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          booking_id?: string
          review_requested_at?: string | null
          review_sent_at?: string | null
          follow_up_sent_at?: string | null
          status?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
