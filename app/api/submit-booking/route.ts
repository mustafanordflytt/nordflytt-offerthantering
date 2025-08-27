import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { sendOfferNotifications } from '@/lib/notifications'
import { 
  authenticateAPI, 
  AuthLevel, 
  apiError, 
  apiResponse, 
  validateInput,
  sanitizeHTML,
  logAPIAccess 
} from '@/lib/api-auth'
import { encryptObject, SENSITIVE_FIELDS } from '@/lib/encryption'

// Skapa ett submissionCache för att förhindra dubletter
const submissionCache = new Map();

// Input validation schema
const bookingSchema = {
  customerInfo: {
    type: 'object' as const,
    required: false
  },
  email: {
    type: 'string' as const,
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: 'string' as const,
    required: false,
    pattern: /^[\d\s\-\+\(\)]+$/
  },
  name: {
    type: 'string' as const,
    required: false,
    min: 2,
    max: 100
  },
  customerType: {
    type: 'string' as const,
    required: false,
    enum: ['private', 'company']
  },
  serviceType: {
    type: 'string' as const,
    required: false,
    enum: ['moving', 'cleaning', 'office_moving', 'storage']
  },
  moveDate: {
    type: 'string' as const,
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/
  },
  startAddress: {
    type: 'string' as const,
    required: false,
    max: 200
  },
  endAddress: {
    type: 'string' as const,
    required: false,
    max: 200
  }
}

export async function POST(request: NextRequest) {
  // Authenticate - public endpoint but with rate limiting
  const auth = await authenticateAPI(request, AuthLevel.PUBLIC)
  if (!auth.authorized) {
    return auth.response!
  }

  // Skapa ett unikt ID för denna request för att spåra duplicerade anrop
  const requestId = Math.random().toString(36).substring(2, 10);
  console.log(`[${requestId}] Ny bokningsförfrågan mottagen`);
  
  let response: NextResponse
  
  try {
    const data = await request.json();
    
    // Validate input
    const validation = validateInput(data, bookingSchema)
    if (!validation.valid) {
      return apiError(`Invalid input: ${validation.errors.join(', ')}`, 400, 'VALIDATION_ERROR')
    }
    
    // Generera ett fingeravtryck baserat på kunddata
    const customerEmail = data.customerInfo?.email || data.email || "";
    const customerPhone = data.customerInfo?.phone || data.phone || "";
    const fingerprint = `${customerEmail}:${customerPhone}:${Date.now().toString().substring(0, 8)}`;
    
    // Kontrollera om vi nyligen tagit emot en liknande submission 
    const now = Date.now();
    if (submissionCache.has(fingerprint)) {
      const lastTime = submissionCache.get(fingerprint);
      if (now - lastTime < 10000) { // 10 sekunder
        console.log(`[${requestId}] Hoppar över duplicerad insändning för ${fingerprint}`);
        return NextResponse.json({
          message: "Bokning mottagen och sparad",
          duplicated: true
        });
      }
    }
    
    // Markera denna submission som behandlad
    submissionCache.set(fingerprint, now);
    
    // Rensa gamla poster om cachen blir för stor
    if (submissionCache.size > 50) {
      const tooOld = now - 30 * 60 * 1000; // 30 minuter
      for (const [key, time] of submissionCache.entries()) {
        if (time < tooOld) submissionCache.delete(key);
      }
    }
    
    console.log(`[${requestId}] Mottagen bokningsdata:`, JSON.stringify(data))
    
    // Skapa ett korrekt formaterat bookingData-objekt med sanitized data
    const customerData = {
      name: sanitizeHTML(data.customerInfo?.name || data.name || ""),
      email: data.customerInfo?.email || data.email || "",
      phone: data.customerInfo?.phone || data.phone || "",
      customer_type: data.customerType || "private",
      notes: sanitizeHTML(data.specialInstructions || data.customerInfo?.notes || data.notes || "")
    }
    
    console.log(`[${requestId}] Försöker skapa eller uppdatera kund:`, JSON.stringify(customerData))
    
    // Kolla först om kunden finns - ÄNDRAT HÄR, tar bort .maybeSingle()
    const { data: existingCustomers, error: searchError } = await supabase
      .from("customers")
      .select("id")
      .eq("email", customerData.email)

    let customerId;

    if (searchError) {
      console.error(`[${requestId}] Fel vid sökning efter kund:`, searchError)
      throw new Error(`Kunde inte söka efter kund: ${searchError.message}`)
    }

    // ÄNDRAT HÄR: Kontrollera om vi hittade någon befintlig kund
    if (existingCustomers && existingCustomers.length > 0) {
      // Använd den första kunden vi hittar om det finns flera
      customerId = existingCustomers[0].id
      console.log(`[${requestId}] Hittade befintlig kund med ID:`, customerId)
      
      // Uppdatera kunddata
      const { error: updateError } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", customerId)
      
      if (updateError) {
        console.error(`[${requestId}] Fel vid uppdatering av kund:`, updateError)
        throw new Error(`Kunde inte uppdatera kund: ${updateError.message}`)
      }
      
      console.log(`[${requestId}] Kund uppdaterad`)
    } else {
      // Skapa ny kund
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert(customerData)
        .select("id")
        .single()
        
      if (customerError) {
        console.error(`[${requestId}] Fel vid skapande av kund:`, customerError)
        throw new Error(`Kunde inte skapa kund: ${customerError.message}`)
      }
      
      customerId = newCustomer.id
      console.log(`[${requestId}] Ny kund skapad med ID:`, customerId)
    }
    
    // Beräkna totalpriset
    const totalPrice = calculateTotalPrice(data)
    
    // Prepare booking data with sanitization
    const bookingData = {
      customer_id: customerId,
      service_type: data.serviceType || "",
      service_types: data.serviceTypes || [],
      move_date: data.moveDate || data.moveDetails?.moveDate || null,
      move_time: data.moveTime || "08:00",
      start_address: sanitizeHTML(data.startAddress || data.moveDetails?.startAddress || ""),
      end_address: sanitizeHTML(data.endAddress || data.moveDetails?.endAddress || ""),
      status: "pending",
      total_price: totalPrice,
      created_at: new Date().toISOString(),
      // Lägg till all detaljerad information i details fältet
      details: {
        ...data, // Spara all formulärdata
        customerName: customerData.name,
        totalPrice: totalPrice,
        reference: `NF-${Date.now()}`
      }
    }
    
    // Encrypt sensitive fields before storing
    const encryptedBookingData = encryptObject(bookingData, ['start_address', 'end_address'])
    
    // Also encrypt sensitive customer data if present
    if (bookingData.details.customerInfo) {
      bookingData.details.customerInfo = encryptObject(
        bookingData.details.customerInfo,
        ['email', 'phone', 'address']
      )
    }
    
    console.log(`[${requestId}] Försöker skapa bokning:`, JSON.stringify(bookingData))
    
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert(encryptedBookingData)
      .select()
      .single()
    
    if (bookingError) {
      console.error(`[${requestId}] Fel vid skapande av bokning:`, bookingError)
      throw new Error(`Kunde inte skapa bokning: ${bookingError.message}`)
    }

    // Efter att bokningen har skapats, skicka notifieringar
    try {
      console.log(`[${requestId}] Förbereder att skicka notifieringar för bokning ${booking.id} (${Date.now()})`);
      
      const offerData = {
        id: booking.id,
        customerName: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        totalPrice: bookingData.total_price,
        services: [bookingData.service_type],
        expectedEndTime: "18:00", // Lägg till detta för att undvika undefined i mallen
      };
      
      const notificationResult = await sendOfferNotifications(offerData);
      console.log(`[${requestId}] Notifieringsresultat för bokning ${booking.id}:`, notificationResult);
    } catch (notificationError) {
      console.error(`[${requestId}] Fel vid skickande av notifieringar:`, notificationError);
      // Fortsätter trots notifieringsfel eftersom bokningen har skapats
    }

    console.log(`[${requestId}] Returnerar svar till klienten för bokning ${booking.id}`);
    response = apiResponse({
      message: "Bokning mottagen och sparad",
      bookingId: booking.id,
      bookingDetails: booking,
    })
    
    // Log API access
    logAPIAccess(request, response)
    return response
  } catch (error) {
    console.error(`[${requestId}] Error submitting booking:`, error)
    response = apiError(
      "Kunde inte spara bokningen", 
      500,
      'BOOKING_ERROR'
    )
    
    // Log API access even on error
    logAPIAccess(request, response)
    return response
  }
}

// Enkel funktion för att beräkna totalpris
// Detta är bara en placeholder - implementera din egen prislogik
function calculateTotalPrice(data: any): number {
  // Om ett beräknat totalpris redan finns, använd det
  if (data.totalPrice && typeof data.totalPrice === 'number') {
    return data.totalPrice;
  }
  
  let basePrice = 0

  // Grundpris baserat på tjänstetyp
  if (data.serviceType === "moving") {
    basePrice = 5000
  } else if (data.serviceType === "cleaning") {
    basePrice = 2000
  } else if (data.serviceTypes?.includes("office_moving")) {
    basePrice = 10000
  }

  // Lägg till extra kostnader baserat på tillvalstjänster
  if (data.additionalServices) {
    data.additionalServices.forEach((service: any) => {
      if (service.selected && service.price) {
        basePrice += service.price;
      } else if (typeof service === 'string') {
        // Om service är en sträng istället för ett objekt
        switch (service) {
          case "packing":
            basePrice += 1500
            break
          case "unpacking":
            basePrice += 1500
            break
          case "furniture_assembly":
            basePrice += 2000
            break
          // Lägg till fler tjänster efter behov
        }
      }
    })
  }

  return basePrice
}
