import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBookingNotifications } from '@/lib/notifications';
import { berakna_flyttkostnad, type MoveDetails } from '@/lib/pricing';
import { generateBookingReference } from '@/lib/utils/reference';
import { syncBookingToCRM } from '@/lib/crm-sync';

interface FormData {
  name: string;
  email: string;
  phone: string;
  customerType: string;
  serviceType: string;
  serviceTypes: string[];
  moveDate: string;
  moveTime: string;
  startAddress: string;
  endAddress: string;
  startFloor: string;
  endFloor: string;
  startElevator: string;
  endElevator: string;
  startParkingDistance: string;
  endParkingDistance: string;
  startLivingArea: string;
  endLivingArea: string;
  startPropertyType: string;
  endPropertyType: string;
  startDoorCode: string;
  endDoorCode: string;
  calculatedDistance?: string;
  movingBoxes?: number;
  largeItems?: string[];
  specialItems?: string[];
  packingService?: string;
  cleaningService?: string;
  additionalServices?: string[];
  specialInstructions?: string;
  paymentMethod: string;
  estimatedVolume?: number;
  needsMovingBoxes?: boolean;
  totalPrice?: number;
  // Credit check fields
  personalNumber?: string;
  creditCheckId?: string;
  depositAmount?: number;
  [key: string]: any;
}

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(2, 10);
  console.log(`[${requestId}] Ny bokningsförfrågan mottagen (med kreditprövning)`);

  try {
    const formData = await request.json();
    console.log(`[${requestId}] Form data mottagen:`, Object.keys(formData));

    // Create Supabase client
    const supabase = createRouteHandlerClient({ 
      cookies 
    }, {
      options: {
        global: {
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      },
    });

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      console.log(`[${requestId}] Saknade obligatoriska fält:`, missingFields);
      return NextResponse.json(
        { 
          success: false, 
          error: `Saknade obligatoriska fält: ${missingFields.join(', ')}` 
        }, 
        { status: 400 }
      );
    }

    // Validate credit check for private customers with invoice payment
    if (formData.customerType === 'private' && formData.paymentMethod === 'invoice') {
      if (!formData.creditCheckId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Kreditprövning krävs för fakturabetalning' 
          }, 
          { status: 400 }
        );
      }

      // Verify credit check is valid
      const { data: creditCheck, error: creditCheckError } = await supabase
        .from('credit_checks')
        .select('status, expires_at')
        .eq('id', formData.creditCheckId)
        .single();

      if (creditCheckError || !creditCheck) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Ogiltig kreditprövning' 
          }, 
          { status: 400 }
        );
      }

      if (creditCheck.status !== 'approved' || 
          (creditCheck.expires_at && new Date(creditCheck.expires_at) < new Date())) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Kreditprövning har gått ut eller är inte godkänd' 
          }, 
          { status: 400 }
        );
      }
    }

    // Check for duplicate submissions
    const { email, phone, moveDate } = formData;
    
    console.log(`[${requestId}] 🔍 Kollar efter duplicates för:`, { email, phone, moveDate });
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentBooking } = await supabase
      .from('bookings')
      .select('id, created_at, customer_email, customer_phone, move_date')
      .eq('customer_email', email)
      .eq('customer_phone', phone)
      .eq('move_date', moveDate)
      .gte('created_at', fiveMinutesAgo)
      .single();

    if (recentBooking) {
      console.log(`[${requestId}] 🚫 Duplicate submission prevented - returning existing booking:`, recentBooking.id);
      
      return NextResponse.json({
        success: true,
        requestId,
        bookingId: recentBooking.id,
        totalPrice: formData.totalPrice || 3630,
        database: true,
        notifications: {
          emailSent: false,
          smsSent: false,
          hasEmailError: false,
          hasSmsError: false
        },
        message: 'Bokningsförfrågan redan mottagen - returnerar befintlig bokning'
      });
    }

    console.log(`[${requestId}] ✅ No recent duplicates found - proceeding with new booking`);

    // Create or update customer
    const customerData = {
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      customer_type: formData.customerType,
      personal_number: formData.personalNumber || null,
      personal_number_verified: !!formData.creditCheckId,
      notes: null
    };

    console.log(`[${requestId}] Försöker skapa eller uppdatera kund:`, customerData);

    let customerId;

    try {
      // Search for existing customer
      const { data: existingCustomers, error: searchError } = await supabase
        .from('customers')
        .select('id, customer_phone')
        .eq('customer_email', formData.email)
        .limit(1);

      if (searchError) {
        console.error(`[${requestId}] Fel vid sökning efter kund:`, searchError);
        throw searchError;
      }

      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
        console.log(`[${requestId}] Hittade befintlig kund med ID:`, customerId);

        // Update customer info
        const updateData: any = {
          customer_type: formData.customerType,
          updated_at: new Date().toISOString()
        };
        
        // Update personal number if provided
        if (formData.personalNumber) {
          updateData.personal_number = formData.personalNumber;
          updateData.personal_number_verified = !!formData.creditCheckId;
          updateData.personal_number_verified_at = formData.creditCheckId ? new Date().toISOString() : null;
        }
        
        // Only update phone if it's different
        if (formData.phone !== existingCustomers[0].customer_phone) {
          updateData.customer_phone = formData.phone;
        }

        const { error: updateError } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', customerId);

        if (updateError) {
          console.error(`[${requestId}] Fel vid uppdatering av kund:`, updateError);
          throw updateError;
        }

        console.log(`[${requestId}] Kund kontaktinfo uppdaterad`);
        
        // Link credit check to customer
        if (formData.creditCheckId) {
          await supabase
            .from('credit_checks')
            .update({ customer_id_legacy: customerId })
            .eq('id', formData.creditCheckId);
        }
      } else {
        // Create new customer
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert([customerData])
          .select('id')
          .single();

        if (createError) {
          console.error(`[${requestId}] Fel vid skapande av kund:`, createError);
          throw createError;
        }

        customerId = newCustomer.id;
        console.log(`[${requestId}] Ny kund skapad med ID:`, customerId);
        
        // Link credit check to customer
        if (formData.creditCheckId) {
          await supabase
            .from('credit_checks')
            .update({ customer_id_legacy: customerId })
            .eq('id', formData.creditCheckId);
        }
      }
    } catch (customerError) {
      console.error(`[${requestId}] Fel med kund-hantering:`, customerError);
      customerId = null;
    }

    // Calculate total price
    const moveDetails: MoveDetails = {
      volym_m3: Number(formData.estimatedVolume) || 0,
      avstand_km: Number(formData.calculatedDistance) || 0,
      hiss_typ_A: formData.startElevator === 'big' ? 'stor' : 
                  formData.startElevator === 'small' ? 'liten' : 
                  formData.startElevator === 'none' ? 'ingen' : 'trappa',
      vaningar_A: Number(formData.startFloor) || 0,
      hiss_typ_B: formData.endElevator === 'big' ? 'stor' : 
                  formData.endElevator === 'small' ? 'liten' : 
                  formData.endElevator === 'none' ? 'ingen' : 'trappa',
      vaningar_B: Number(formData.endFloor) || 0,
      lagenhet_kvm: Number(formData.startLivingArea) || 0,
      packHjalp: formData.packingService !== 'Ingen packning',
      flyttstad: formData.cleaningService !== 'Ingen städning',
      antal_tunga_objekt: (formData.largeItems || []).length,
      lang_barvag: Number(formData.startParkingDistance) > 10 || Number(formData.endParkingDistance) > 10,
      barvag_extra_meter: Math.max(
        Number(formData.startParkingDistance) - 10,
        Number(formData.endParkingDistance) - 10,
        0
      ),
      nyckelkund: false,
      lagsasong: false,
      mobelmontering: false,
      upphangning: false,
      bortforsling: false,
      allergistadning: false,
      antal_flyttkartonger: 0,
      antal_garderobskartonger: 0,
      antal_tavelkartonger: 0,
      antal_spegelkartonger: 0
    };

    const priceCalculation = berakna_flyttkostnad(moveDetails);
    const totalPrice = priceCalculation.slutpris;

    // Create booking
    let bookingId = null;
    let offerReference = null;

    try {
      offerReference = generateBookingReference();
      
      console.log(`[${requestId}] Creating booking:`, {
        reference: offerReference,
        customer_id: customerId,
        email: formData.email,
        paymentMethod: formData.paymentMethod
      });

      const bookingData = {
        customer_id: customerId,
        customer_email: formData.email,
        customer_phone: formData.phone,
        service_type: formData.serviceType,
        service_types: formData.serviceTypes,
        move_date: formData.moveDate,
        move_time: formData.moveTime,
        start_address: formData.startAddress,
        end_address: formData.endAddress,
        start_living_area: formData.startLivingArea,
        end_living_area: formData.endLivingArea,
        start_floor: formData.startFloor,
        end_floor: formData.endFloor,
        start_elevator: formData.startElevator,
        end_elevator: formData.endElevator,
        start_parking_distance: formData.startParkingDistance,
        end_parking_distance: formData.endParkingDistance,
        has_balcony: false,
        additional_services: formData.additionalServices || [],
        special_instructions: formData.specialInstructions || '',
        payment_method: formData.paymentMethod,
        status: 'pending',
        total_price: totalPrice,
        price_details: priceCalculation,
        moving_date: formData.moveDate,
        details: {
          ...formData,
          customerName: formData.name,
          estimatedVolume: moveDetails.volym_m3,
          reference: offerReference,
          movingBoxes: formData.movingBoxes || 0,
          rentalBoxes: formData.rentalBoxes || {},
          needsMovingBoxes: formData.needsMovingBoxes !== false,
          // Credit check details
          creditCheckId: formData.creditCheckId,
          depositAmount: formData.depositAmount,
          paymentMethod: formData.paymentMethod,
          personalNumber: formData.personalNumber ? formData.personalNumber.replace(/\d{4}$/, 'XXXX') : null // Mask last 4 digits
        }
      };

      console.log(`[${requestId}] Saving booking to database...`);

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select('id')
        .single();

      if (bookingError) {
        console.error(`[${requestId}] ❌ Failed to create booking:`, bookingError);
        throw bookingError;
      }
      
      bookingId = booking.id;
      console.log(`[${requestId}] ✅ Booking created with ID:`, bookingId);
      
      // Handle deposit payment if required
      if (formData.paymentMethod === 'invoice_with_deposit' && formData.depositAmount) {
        // In production, integrate with payment provider here
        console.log(`[${requestId}] 💳 Deposit payment required: ${formData.depositAmount} kr`);
        // For now, we'll assume payment is handled separately
      }
      
      // Send notifications
      const notificationResult = await sendBookingNotifications(
        bookingId,
        formData,
        offerReference
      );
      
      console.log(`[${requestId}] ✅ Notifieringsresultat:`, notificationResult);
      
      // Create CRM entries
      const crmResult = await syncBookingToCRM({
        ...formData,
        totalPrice,
        offerId: bookingId,
        offerReference: offerReference
      }, bookingId);
      
      if (crmResult.success) {
        console.log(`[${requestId}] ✅ CRM sync successful`);
      }
    } catch (bookingError) {
      console.error(`[${requestId}] ❌ Kunde inte skapa bokning:`, bookingError);
      throw bookingError;
    }

    console.log(`[${requestId}] Returnerar svar till klienten`);

    // Return success response with redirect URL
    const response = {
      success: true,
      requestId,
      bookingId,
      customerId,
      bookingReference: offerReference,
      totalPrice,
      database: !!bookingId,
      redirectUrl: `/offer/${bookingId}`,
      paymentMethod: formData.paymentMethod,
      depositRequired: formData.paymentMethod === 'invoice_with_deposit',
      depositAmount: formData.depositAmount,
      message: 'Bokningsförfrågan mottagen'
    };

    console.log(`[${requestId}] 🎉 SLUTLIG RESPONS:`, response);

    return NextResponse.json(response);

  } catch (error) {
    console.error(`[${requestId}] 💥 FATAL ERROR:`, {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        requestId,
        error: error instanceof Error ? error.message : 'Ett okänt fel uppstod',
        details: 'Server error - se loggar för mer information'
      }, 
      { status: 500 }
    );
  }
}