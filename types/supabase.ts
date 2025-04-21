export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          customer_type: string
          created_at: string
          updated_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          customer_type: string
          created_at?: string
          updated_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          customer_type?: string
          created_at?: string
          updated_at?: string | null
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
          customer_id: string
          service_type: string
          service_types: string[]
          move_date: string
          move_time: string
          start_address: string
          end_address: string
          status: string
          total_price: number
          created_at: string
          updated_at: string | null
          [key: string]: any
        }
        Insert: {
          id?: string
          customer_id: string
          service_type: string
          service_types: string[]
          move_date: string
          move_time: string
          start_address: string
          end_address: string
          status: string
          total_price: number
          created_at?: string
          updated_at?: string | null
          [key: string]: any
        }
        Update: {
          id?: string
          customer_id?: string
          service_type?: string
          service_types?: string[]
          move_date?: string
          move_time?: string
          start_address?: string
          end_address?: string
          status?: string
          total_price?: number
          created_at?: string
          updated_at?: string | null
          [key: string]: any
        }
      }
    }
  }
}
