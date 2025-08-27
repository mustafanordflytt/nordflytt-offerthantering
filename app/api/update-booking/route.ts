// 🔧 FIXAD: app/api/update-booking/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateBookingStatus } from '@/lib/crm-sync';
import { 
  authenticateAPI, 
  AuthLevel, 
  apiError, 
  apiResponse, 
  validateInput,
  sanitizeHTML,
  logAPIAccess 
} from '@/lib/api-auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Input validation schema
const updateBookingSchema = {
  bookingId: {
    type: 'string' as const,
    required: true,
    pattern: /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i // UUID pattern
  },
  updates: {
    type: 'object' as const,
    required: true
  }
}

export async function POST(request: NextRequest) {
  // Authenticate - requires authentication
  const auth = await authenticateAPI(request, AuthLevel.AUTHENTICATED)
  if (!auth.authorized) {
    return auth.response!
  }
  
  let response: NextResponse
  
  try {
    const requestData = await request.json();
    
    // Validate input
    const validation = validateInput(requestData, updateBookingSchema)
    if (!validation.valid) {
      return apiError(`Invalid input: ${validation.errors.join(', ')}`, 400, 'VALIDATION_ERROR')
    }
    const { bookingId, updates } = requestData;
    
    console.log(`[UPDATE BOOKING] 🔥 FULL REQUEST RECEIVED:`, JSON.stringify(requestData, null, 2));
    
    if (!bookingId || !updates) {
      console.error(`[UPDATE BOOKING] ❌ Missing required fields - bookingId: ${bookingId}, updates: ${updates}`);
      return NextResponse.json(
        { success: false, error: 'Missing bookingId or updates' },
        { status: 400 }
      );
    }

    console.log(`[UPDATE BOOKING] Updating booking/quote ${bookingId}:`, updates);

    // Bestäm vilken tabell att uppdatera genom att först kontrollera vilken som innehåller data
    let targetTable = null;
    let existingData = null;

    // 🔧 Kolla först i quotes-tabellen (eftersom det är där data läses från)
    const { data: quoteData, error: quoteCheckError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (quoteData && !quoteCheckError) {
      targetTable = 'quotes';
      existingData = quoteData;
      console.log(`[UPDATE BOOKING] Found data in quotes table`);
    } else {
      // Om inte i quotes, kolla i bookings
      const { data: bookingData, error: bookingCheckError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingData && !bookingCheckError) {
        targetTable = 'bookings';
        existingData = bookingData;
        console.log(`[UPDATE BOOKING] Found data in bookings table`);
      }
    }

    if (!targetTable || !existingData) {
      return NextResponse.json(
        { success: false, error: `Booking/Quote not found with ID: ${bookingId}` },
        { status: 404 }
      );
    }

    // Bygg updateData-objektet
    let updateData: any = {};
    let detailsUpdate: any = { ...existingData.details || {} };

    // 🔧 VOLYM HANTERING
    if (updates.volume !== undefined) {
      updateData.move_size = updates.volume;
      detailsUpdate.estimatedVolume = updates.volume.toString();
      detailsUpdate.volym_m3 = parseFloat(updates.volume);
    } else if (updates.moveSize !== undefined) {
      updateData.move_size = updates.moveSize;
      detailsUpdate.estimatedVolume = updates.moveSize.toString();
      detailsUpdate.volym_m3 = parseFloat(updates.moveSize);
    }
    
    // 🔧 PRIS HANTERING
    if (updates.totalPrice !== undefined) {
      updateData.total_price = updates.totalPrice;
    }
    
    if (updates.total_price !== undefined) {
      updateData.total_price = updates.total_price;
    }
    
    // 🔧 DATUM OCH TID HANTERING
    if (updates.moveDate !== undefined || updates.move_date !== undefined) {
      const dateValue = updates.moveDate || updates.move_date;
      console.log(`[UPDATE BOOKING] Processing date update: ${dateValue}`);
      updateData.move_date = dateValue;
      detailsUpdate.moveDate = dateValue;
    }
    
    if (updates.moveTime !== undefined || updates.move_time !== undefined) {
      const timeValue = updates.moveTime || updates.move_time;
      console.log(`[UPDATE BOOKING] Processing time update: ${timeValue}`);
      updateData.move_time = timeValue;
      detailsUpdate.moveTime = timeValue;
    }
    
    // 🔧 ADRESS HANTERING - Endast i details-objektet
    if (updates.startAddress !== undefined || updates.start_address !== undefined) {
      const addressValue = sanitizeHTML(updates.startAddress || updates.start_address || "");
      detailsUpdate.startAddress = addressValue;
    }
    
    if (updates.endAddress !== undefined || updates.end_address !== undefined) {
      const addressValue = sanitizeHTML(updates.endAddress || updates.end_address || "");
      detailsUpdate.endAddress = addressValue;
    }
    
    // 🔧 VÅNING OCH HISS HANTERING
    if (updates.details !== undefined) {
      if (updates.details.startFloor !== undefined) {
        detailsUpdate.startFloor = updates.details.startFloor;
      }
      if (updates.details.endFloor !== undefined) {
        detailsUpdate.endFloor = updates.details.endFloor;
      }
      if (updates.details.startElevator !== undefined) {
        detailsUpdate.startElevator = updates.details.startElevator;
      }
      if (updates.details.endElevator !== undefined) {
        detailsUpdate.endElevator = updates.details.endElevator;
      }
    }
    
    // Direkta mappningar för våningar och hissar
    if (updates.startFloor !== undefined) {
      detailsUpdate.startFloor = updates.startFloor;
    }
    
    if (updates.endFloor !== undefined) {
      detailsUpdate.endFloor = updates.endFloor;
    }
    
    if (updates.startElevator !== undefined) {
      detailsUpdate.startElevator = updates.startElevator;
    }
    
    if (updates.endElevator !== undefined) {
      detailsUpdate.endElevator = updates.endElevator;
    }
    
    // 🔧 HANTERA DETAILS DIREKT - Slå ihop med befintlig details
    if (updates.details !== undefined) {
      // Slå ihop med befintlig details
      detailsUpdate = {
        ...detailsUpdate,
        ...updates.details
      };
      console.log(`[UPDATE BOOKING] Merging details:`, updates.details);
    }
    
    // 🔧 SERVICE HANTERING - Ta bort denna eftersom services kolumn inte existerar
    // Services sparas nu i details objektet istället
    
    if (updates.serviceTypes !== undefined || updates.service_types !== undefined) {
      const serviceTypesValue = updates.serviceTypes || updates.service_types;
      updateData.service_types = serviceTypesValue;
    }

    // Uppdatera details-objektet
    if (Object.keys(detailsUpdate).length > 0) {
      updateData.details = detailsUpdate;
    }

    console.log(`[UPDATE BOOKING] 🔥 FINAL UPDATE DATA for ${targetTable}:`);
    console.log(JSON.stringify(updateData, null, 2));
    console.log(`[UPDATE BOOKING] 🔥 Target table: ${targetTable}`);
    console.log(`[UPDATE BOOKING] 🔥 Booking ID: ${bookingId}`);

    // Utför uppdateringen i rätt tabell
    console.log(`[UPDATE BOOKING] 🔥 Executing Supabase update...`);
    const { data: updatedData, error: updateError } = await supabase
      .from(targetTable)
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();
    
    console.log(`[UPDATE BOOKING] 🔥 Supabase response - data:`, updatedData);
    console.log(`[UPDATE BOOKING] 🔥 Supabase response - error:`, updateError);

    if (updateError) {
      console.error(`[UPDATE BOOKING] Error updating ${targetTable}:`, updateError);
      return NextResponse.json(
        { success: false, error: `Update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log(`[UPDATE BOOKING] ✅ ${targetTable} updated successfully:`, updatedData?.id);
    
    // 🔄 Sync status changes to CRM if applicable
    if (updates.status) {
      console.log(`[UPDATE BOOKING] 🔄 Syncing status change to CRM...`);
      const statusNote = sanitizeHTML(updates.statusNote || `Status updated to: ${updates.status}`);
      await updateBookingStatus(bookingId, updates.status, statusNote);
    }
    
    response = apiResponse({ 
      success: true, 
      data: updatedData,
      table: targetTable 
    });
    
    // Log API access
    logAPIAccess(request, response, auth.session?.userId)
    return response

  } catch (error) {
    console.error('[UPDATE BOOKING] Unexpected error:', error);
    response = apiError(
      'Internal server error',
      500,
      'UPDATE_ERROR'
    )
    
    // Log API access even on error
    logAPIAccess(request, response, auth.session?.userId)
    return response
  }
}