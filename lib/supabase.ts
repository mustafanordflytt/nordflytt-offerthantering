import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/supabase"
import { validateEnvVars } from "./env-check"

// Validera miljövariabler vid import
const envStatus = validateEnvVars()
if (!envStatus.supabaseConfigured) {
  console.error("Supabase miljövariabler saknas. Kontrollera .env.local filen.")
}
if (!envStatus.sendgridConfigured || !envStatus.twilioConfigured) {
  console.warn("Notifieringsfunktioner (e-post/SMS) kanske inte fungerar på grund av saknade miljövariabler.")
}

// Kontrollera att miljövariabler finns
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton pattern för client-side Supabase-klient
let clientSupabaseInstance: ReturnType<typeof createClient<Database>> | null = null

// Exportera en direkt användbar klient-instans för enklare användning i komponenter
export const supabase = createClient<Database>(
  supabaseUrl || "",
  supabaseKey || ""
)

export const createClientSupabaseClient = () => {
  if (clientSupabaseInstance) return clientSupabaseInstance

  clientSupabaseInstance = createClient<Database>(supabaseUrl || "", supabaseKey || "")
  return clientSupabaseInstance
}

// Server-side Supabase-klient med admin-rättigheter
export const createServerSupabaseClient = () => {
  const serverSupabaseUrl = process.env.SUPABASE_URL
  const serverSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serverSupabaseUrl || !serverSupabaseKey) {
    console.error("Supabase server miljövariabler saknas. Kontrollera .env.local filen.")
  }
  
  return createClient<Database>(serverSupabaseUrl || "", serverSupabaseKey || "")
}

// Hjälpfunktioner för att hantera offerter
export const quoteService = {
  async createQuote(quoteData: any) {
    const supabase = createServerSupabaseClient()

    // Skapa kund om den inte finns
    let customerId = quoteData.customerId

    if (!customerId && quoteData.customerInfo) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: quoteData.customerInfo.name,
          email: quoteData.customerInfo.email,
          phone: quoteData.customerInfo.phone,
          customer_type: quoteData.customerType || "Privat",
          notes: JSON.stringify({
            address: quoteData.customerInfo.address,
          }),
        })
        .select("id")
        .single()

      if (customerError) {
        console.error("Fel vid skapande av kund:", customerError)
        throw new Error(`Kunde inte skapa kund: ${customerError.message}`)
      }

      customerId = customer.id
    }

    // Skapa offert
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        customer_id: customerId,
        services: quoteData.services || [],
        value: quoteData.totalPrice || 0,
        status: "Väntande",
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dagar
        details: JSON.stringify({
          moveDetails: quoteData.moveDetails,
          inventory: quoteData.inventory,
          additionalServices: quoteData.additionalServices,
        }),
      })
      .select()
      .single()

    if (quoteError) {
      console.error("Fel vid skapande av offert:", quoteError)
      throw new Error(`Kunde inte skapa offert: ${quoteError.message}`)
    }

    return quote
  },

  async getQuote(id: string) {
    const supabase = createServerSupabaseClient()

    const { data: quote, error } = await supabase
      .from("quotes")
      .select(`
        *,
        customers (*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Fel vid hämtning av offert:", error)
      throw new Error(`Kunde inte hämta offert: ${error.message}`)
    }

    return quote
  },
}

// Hjälpfunktioner för att hantera bokningar
export const bookingService = {
  async createBooking(bookingData: any) {
    const supabase = createServerSupabaseClient()

    // Skapa kund om den inte finns
    let customerId = bookingData.customerId

    if (!customerId && bookingData.customerInfo) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: bookingData.customerInfo.name,
          email: bookingData.customerInfo.email,
          phone: bookingData.customerInfo.phone,
          customer_type: bookingData.customerType || "Privat",
          notes: bookingData.customerInfo.notes || null,
        })
        .select("id")
        .single()

      if (customerError) {
        console.error("Fel vid skapande av kund:", customerError)
        throw new Error(`Kunde inte skapa kund: ${customerError.message}`)
      }

      customerId = customer.id
    }

    // Skapa bokning
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        customer_id: customerId,
        service_type: bookingData.serviceType,
        service_types: bookingData.serviceTypes || [],
        move_date: bookingData.moveDate || null,
        move_time: bookingData.moveTime || null,
        start_address: bookingData.startAddress || null,
        end_address: bookingData.endAddress || null,
        status: bookingData.status || "pending",
        total_price: bookingData.totalPrice || 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (bookingError) {
      console.error("Fel vid skapande av bokning:", bookingError)
      throw new Error(`Kunde inte skapa bokning: ${bookingError.message}`)
    }

    return booking
  },

  async getBooking(id: string) {
    const supabase = createServerSupabaseClient()

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        customers (*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Fel vid hämtning av bokning:", error)
      throw new Error(`Kunde inte hämta bokning: ${error.message}`)
    }

    return booking
  },

  async updateBookingStatus(id: string, status: string) {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("bookings")
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Fel vid uppdatering av bokningsstatus:", error)
      throw new Error(`Kunde inte uppdatera bokningsstatus: ${error.message}`)
    }

    return data
  }
}
