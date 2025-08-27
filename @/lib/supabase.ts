import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Singleton pattern för client-side Supabase-klient
let clientSupabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const createClientSupabaseClient = () => {
  if (clientSupabaseInstance) return clientSupabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  clientSupabaseInstance = createClient<Database>(supabaseUrl, supabaseKey)
  return clientSupabaseInstance
}

// Server-side Supabase-klient med admin-rättigheter
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(supabaseUrl, supabaseKey)
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
