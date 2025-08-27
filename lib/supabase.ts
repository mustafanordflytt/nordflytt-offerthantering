import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/supabase"
import { validateEnvVars } from "./env-check"
import { berakna_flyttkostnad, type MoveDetails } from "./pricing"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { reviewService as reviewServiceImpl } from './review-service';

// Validera miljövariabler vid import - men bara om vi är i produktion eller explicit testar
const envStatus = validateEnvVars()
if (process.env.NODE_ENV === 'production' && !envStatus.supabaseConfigured) {
  console.error("Supabase miljövariabler saknas. Kontrollera .env.local filen.")
}
// I utvecklingsmiljö, visa bara varning om det är första gången
if (process.env.NODE_ENV !== 'production' && !envStatus.supabaseConfigured && typeof window === 'undefined') {
  console.warn("Supabase miljövariabler verkar saknas vid första laddning. Detta är normalt i utvecklingsmiljö.")
}
if (!envStatus.sendgridConfigured || !envStatus.twilioConfigured) {
  // Endast visa varning en gång per session
  if (typeof window === 'undefined') {
    console.warn("Notifieringsfunktioner (e-post/SMS) kanske inte fungerar på grund av saknade miljövariabler.")
  }
}

// Kontrollera att miljövariabler finns
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton pattern för client-side Supabase-klient
let clientSupabaseInstance: ReturnType<typeof createClient<Database>> | null = null

// Exportera en direkt användbar klient-instans för enklare användning i komponenter
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

export const createClientSupabaseClient = () => {
  if (clientSupabaseInstance) return clientSupabaseInstance

  clientSupabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  })
  return clientSupabaseInstance
}

// LÄGG TILL: Alias för att matcha auth-helpers-nextjs API namn
export const createClientComponentClient = createClientSupabaseClient

// Server-side Supabase-klient med admin-rättigheter
export const createServerSupabaseClient = () => {
  // För client-side, använd public miljövariabler
  if (typeof window !== 'undefined') {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    })
  }
  
  // För server-side, använd service role
  const serverSupabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serverSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!serverSupabaseUrl || !serverSupabaseKey) {
    console.error("Supabase server miljövariabler saknas. Kontrollera .env.local filen.")
    throw new Error("supabaseUrl is required")
  }
  
  return createClient<Database>(serverSupabaseUrl, serverSupabaseKey)
}

// Export createClient för API-routes (använder server-side client för API:er)
export { createServerSupabaseClient as createClient }

// Hjälpfunktion för att avgöra om det är lågsäsong
function isLowSeason(date: string | undefined): boolean {
  if (!date) return false;
  
  const moveDate = new Date(date);
  const month = moveDate.getMonth() + 1; // JavaScript månader är 0-baserade
  
  // Lågsäsong är november-februari (månad 11, 12, 1, 2)
  return month >= 11 || month <= 2;
}

// Hjälpfunktion för att rensa ID från oönskade tecken
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-]/g, '')
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
        start_address: quoteData.moveDetails?.startAddress || '',
        end_address: quoteData.moveDetails?.endAddress || '',
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
    try {
      console.log('Försöker hämta offert med ID:', id)
      
      // Rensa ID från eventuella oönskade tecken
      const cleanId = sanitizeId(id)
      
      // Först, försök hitta i bookings-tabellen
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (
            name,
            email,
            phone
          )
        `)
        .eq('id', cleanId)
        .single()
      
      console.log('Resultat från bookings-sökning:', { booking, bookingError })
      
      if (booking) {
        console.log('Hittade bokning i bookings-tabellen')
        console.log('Booking details:', booking.details)
        console.log('Booking start_address:', booking.start_address)
        console.log('Booking end_address:', booking.end_address)
        console.log('Customer:', booking.customers)
        
        // 🔧 FIXAT: Använd calculatedDistance från details istället för hårdkodat värde
        const distance = Number(booking.details?.calculatedDistance || 15);
        
        // Använd all information från formuläret
        const moveDetails = {
          // 🔧 FIXAT: Använd estimatedVolume från details eller beräkna från boarea
          volym_m3: booking.details?.estimatedVolume > 0 ? Number(booking.details.estimatedVolume) : 
                   Math.ceil((Number(booking.details?.startLivingArea) || Number(booking.details?.endLivingArea) || 70) * 0.35),
          avstand_km: distance,
          hiss_typ_A: (booking.details?.startElevator === 'big' ? 'stor' : 
                      booking.details?.startElevator === 'small' ? 'liten' : 'trappa') as 'stor' | 'liten' | 'ingen' | 'trappa',
          hiss_typ_B: (booking.details?.endElevator === 'big' ? 'stor' : 
                      booking.details?.endElevator === 'small' ? 'liten' : 'trappa') as 'stor' | 'liten' | 'ingen' | 'trappa',
          vaningar_A: Number(booking.details?.startFloor || 0),
          vaningar_B: Number(booking.details?.endFloor || 0),
          lagenhet_kvm: Number(booking.details?.startLivingArea || 70),
          packHjalp: booking.details?.packingService === 'Packhjälp',
          flyttstad: booking.details?.cleaningService === 'Flyttstädning',
          antal_tunga_objekt: booking.details?.largeItems?.length || 0,
          // 🔧 FIXAT: Använd korrekt parkeringsavstånd från details
          lang_barvag: Number(booking.details?.startParkingDistance || 0) > 10 || 
                      Number(booking.details?.endParkingDistance || 0) > 10,
          barvag_extra_meter: Math.max(
            Math.max(Number(booking.details?.startParkingDistance || 0) - 10, 0),
            Math.max(Number(booking.details?.endParkingDistance || 0) - 10, 0)
          ),
          nyckelkund: false,
          lagsasong: isLowSeason(booking.move_date)
        }
        
        // Beräkna priset med den nya prisformeln
        const priceBreakdown = berakna_flyttkostnad(moveDetails)
        console.log('Prisberäkning:', priceBreakdown)
        
        // Hämta kundnamn från rätt plats
        const customerName = booking.details?.name || 
                           booking.customers?.name || 
                           booking.name || 
                           'Ej angivet';
                           
        console.log('Hämtat kundnamn:', customerName);
        
        return {
          id: booking.id,
          name: customerName,
          customerName: customerName,
          email: booking.customers?.email || booking.details?.email || booking.email || '',
          phone: booking.customers?.phone || booking.details?.phone || booking.phone || '',
          totalPrice: priceBreakdown.slutpris,
          status: booking.status || 'pending',
          services: [{ name: 'Flyttjänst', price: priceBreakdown.slutpris }],
          createdAt: booking.created_at,
          expectedEndTime: '',
          moveDate: booking.move_date || '',
          start_address: booking.start_address || booking.details?.startAddress || '',
          end_address: booking.end_address || booking.details?.endAddress || '',
          details: {
            moveDate: booking.move_date || '',
            // 🔧 FIXAT: Läs moveTime från details istället för hårdkodat fallback
            moveTime: booking.details?.moveTime || booking.move_time?.split('.')[0] || '',
            startAddress: booking.start_address || booking.details?.startAddress || '',
            endAddress: booking.end_address || booking.details?.endAddress || '',
            moveDetails: booking.details || {},
            name: customerName,
            // 🔧 FIXAT: Lägg till alla fält från booking.details
            estimatedVolume: booking.details?.estimatedVolume,
            calculatedDistance: booking.details?.calculatedDistance,
            startFloor: booking.details?.startFloor,
            endFloor: booking.details?.endFloor,
            startElevator: booking.details?.startElevator,
            endElevator: booking.details?.endElevator,
            startParkingDistance: booking.details?.startParkingDistance,
            endParkingDistance: booking.details?.endParkingDistance,
            paymentMethod: booking.details?.paymentMethod,
            needsMovingBoxes: booking.details?.needsMovingBoxes,
            movingBoxes: booking.details?.movingBoxes,
            startPropertyType: booking.details?.startPropertyType,
            endPropertyType: booking.details?.endPropertyType,
            startLivingArea: booking.details?.startLivingArea,
            endLivingArea: booking.details?.endLivingArea,
            startDoorCode: booking.details?.startDoorCode,
            endDoorCode: booking.details?.endDoorCode,
            packingService: booking.details?.packingService,
            cleaningService: booking.details?.cleaningService,
            largeItems: booking.details?.largeItems,
            specialItems: booking.details?.specialItems,
            additionalServices: booking.details?.additionalServices,
            specialInstructions: booking.details?.specialInstructions
          },
          moveDetails: {
            ...moveDetails,
            // 🔧 FIXAT: Använd korrekt data från booking.details
            startFloor: booking.details?.startFloor,
            endFloor: booking.details?.endFloor,
            startElevator: booking.details?.startElevator,
            endElevator: booking.details?.endElevator,
            startDoorCode: booking.details?.startDoorCode || '',
            endDoorCode: booking.details?.endDoorCode || '',
            startParkingDistance: Number(booking.details?.startParkingDistance || 0),
            endParkingDistance: Number(booking.details?.endParkingDistance || 0),
            movingBoxes: Number(booking.details?.movingBoxes || 0),
            estimatedVolume: booking.details?.estimatedVolume || moveDetails.volym_m3,
            calculatedDistance: Number(booking.details?.calculatedDistance || distance),
            startPropertyType: booking.details?.startPropertyType || 'apartment',
            endPropertyType: booking.details?.endPropertyType || 'apartment',
            startLivingArea: booking.details?.startLivingArea,
            endLivingArea: booking.details?.endLivingArea,
            largeItems: booking.details?.largeItems || [],
            specialItems: booking.details?.specialItems || [],
            packingService: booking.details?.packingService || '',
            cleaningService: booking.details?.cleaningService || '',
            additionalServices: booking.details?.additionalServices || [],
            specialInstructions: booking.details?.specialInstructions || '',
            paymentMethod: booking.details?.paymentMethod,
            needsMovingBoxes: booking.details?.needsMovingBoxes
          },
          discount: priceBreakdown.rabatter?.komborabatt || 0,
          discountPercentage: priceBreakdown.komborabatt_procent || 0,
          isFallback: false
        }
      }
      
      // Om ingen bokning hittades, sök i quotes
      const { data: quote, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customers (
            name,
            email,
            phone
          )
        `)
        .eq('id', cleanId)
        .single()
      
      if (quote) {
        const parsedDetails = typeof quote.details === 'string' ? JSON.parse(quote.details) : quote.details;
        console.log('Quote details:', quote.details)
        console.log('Parsed details:', parsedDetails)
        console.log('Quote start_address:', quote.start_address)
        console.log('Quote end_address:', quote.end_address)
        return {
          ...quote,
          move_date: parsedDetails?.moveDate || quote.move_date,
          details: {
            moveDate: parsedDetails?.moveDate || quote.move_date,
            moveTime: parsedDetails?.moveTime || parsedDetails?.time || '',
            startAddress: quote.start_address || '',
            endAddress: quote.end_address || '',
            moveDetails: {
              ...parsedDetails?.moveDetails,
              startAddress: quote.start_address || '',
              endAddress: quote.end_address || ''
            }
          },
          moveDetails: {
            ...parsedDetails?.moveDetails,
            startAddress: quote.start_address || '',
            endAddress: quote.end_address || ''
          }
        }
      }
      
      console.log('Varken offert eller bokning hittades')
      return null
      
    } catch (error) {
      console.error('Error in getQuote:', error)
      throw error
    }
  },

  // Hjälpfunktion för att beräkna pris baserat på tjänstetyp
  calculatePriceBasedOnService(type: string): number {
    switch (type.toLowerCase()) {
      case 'moving':
        return 2700;
      case 'packing':
        return 700;
      case 'cleaning':
        return 2500;
      default:
        return 0;
    }
  }
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
        details: {
          ...bookingData,
          startAddress: bookingData.startAddress,
          endAddress: bookingData.endAddress
        }
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

// Funktion för att rensa schema-cachen
export async function clearSchemaCache() {
  try {
    await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    console.log('Schema cache cleared successfully')
  } catch (error) {
    console.error('Error clearing schema cache:', error)
  }
}

// Re-export reviewService from review-service.ts
export const reviewService = reviewServiceImpl;