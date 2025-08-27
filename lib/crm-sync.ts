import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { SalesPipelineAutomation } from '@/lib/workflows/sales-pipeline-automation';
import { normalizeBookingReference } from '@/lib/utils/booking-reference';
import { createJobWithFallback } from '@/lib/utils/job-creation';

// Initialize Supabase client for CRM operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface CRMSyncResult {
  success: boolean;
  customerId?: string;
  bookingId?: string;
  quoteId?: string;
  aiNotificationSent?: boolean;
  errors?: string[];
}

interface BookingData {
  // Customer info
  name: string;
  email: string;
  phone: string;
  customerType: string;
  
  // Booking details
  serviceType: string;
  serviceTypes: string[];
  moveDate: string;
  moveTime: string;
  startAddress: string;
  endAddress: string;
  totalPrice: number;
  
  // All other form data
  [key: string]: any;
}

/**
 * Sync booking data to CRM with atomic transaction
 * This is the main integration point between booking system and CRM
 */
export async function syncBookingToCRM(
  bookingData: BookingData,
  bookingId?: string
): Promise<CRMSyncResult> {
  const errors: string[] = [];
  let customerId: string | undefined;
  let quoteId: string | undefined;
  let aiNotificationSent = false;

  try {
    console.log('🔄 Starting CRM sync for booking:', { email: bookingData.email, bookingId });

    // Step 1: Create or update customer
    customerId = await upsertCustomer(bookingData);
    if (!customerId) {
      errors.push('Failed to create/update customer');
    }

    // Step 2: Create quote record
    if (customerId) {
      quoteId = await createQuote(customerId, bookingData);
      if (!quoteId) {
        errors.push('Failed to create quote');
      }
    }

    // Step 3: Update booking with CRM references
    if (bookingId && customerId) {
      await updateBookingWithCRMData(bookingId, customerId, quoteId);
    }

    // Step 4: Log communication
    if (customerId) {
      await logCommunication(customerId, bookingData, bookingId);
    }

    // Step 5: Trigger AI customer service (non-blocking)
    if (customerId) {
      aiNotificationSent = await triggerAICustomerService(customerId, bookingData, bookingId);
    }

    return {
      success: errors.length === 0,
      customerId,
      bookingId,
      quoteId,
      aiNotificationSent,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('❌ CRM sync failed:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Create or update customer in CRM
 */
async function upsertCustomer(bookingData: BookingData): Promise<string | undefined> {
  try {
    // Check if customer exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', bookingData.email)
      .eq('phone', bookingData.phone)
      .single();

    if (existingCustomer) {
      // Update existing customer
      const { error } = await supabase
        .from('customers')
        .update({
          name: bookingData.name,
          customer_type: bookingData.customerType,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCustomer.id);

      if (error) throw error;
      console.log('✅ Updated existing customer:', existingCustomer.id);
      return existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          customer_type: bookingData.customerType
        })
        .select('id')
        .single();

      if (error) throw error;
      console.log('✅ Created new customer:', newCustomer.id);
      return newCustomer.id;
    }
  } catch (error) {
    console.error('❌ Customer upsert failed:', error);
    return undefined;
  }
}

/**
 * Create quote record in CRM
 */
async function createQuote(customerId: string, bookingData: BookingData): Promise<string | undefined> {
  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        customer_id: customerId,
        services: bookingData.serviceTypes,
        value: bookingData.totalPrice,
        status: 'pending',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        details: JSON.stringify({
          moveDate: bookingData.moveDate,
          moveTime: bookingData.moveTime,
          startAddress: bookingData.startAddress,
          endAddress: bookingData.endAddress,
          estimatedVolume: bookingData.estimatedVolume,
          specialInstructions: bookingData.specialInstructions,
          additionalBusinessServices: bookingData.additionalBusinessServices || [],
          additionalServices: bookingData.additionalServices || [],
          movingBoxes: bookingData.movingBoxes || 0,
          rentalBoxes: bookingData.rentalBoxes || {},
          needsMovingBoxes: bookingData.needsMovingBoxes !== false
        })
      })
      .select('id')
      .single();

    if (error) throw error;
    console.log('✅ Created quote:', quote.id);
    return quote.id;
  } catch (error) {
    console.error('❌ Quote creation failed:', error);
    return undefined;
  }
}

/**
 * Update booking with CRM references
 */
async function updateBookingWithCRMData(
  bookingId: string, 
  customerId: string, 
  quoteId?: string
): Promise<void> {
  try {
    const updateData: any = {
      customer_id: customerId,
      updated_at: new Date().toISOString()
    };

    if (quoteId) {
      updateData.quote_id = quoteId;
    }

    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (error) throw error;
    console.log('✅ Updated booking with CRM data');
  } catch (error) {
    console.error('❌ Booking update failed:', error);
  }
}

/**
 * Log communication in CRM
 */
async function logCommunication(
  customerId: string, 
  bookingData: BookingData,
  bookingId?: string
): Promise<void> {
  try {
    // Since we don't have a communications table yet, we'll use the notes field
    // In a full implementation, you'd create a proper communications table
    const communicationNote = `
Offertförfrågan mottagen ${new Date().toISOString()}
- Tjänster: ${bookingData.serviceTypes.join(', ')}
- Flyttdatum: ${bookingData.moveDate}
- Pris: ${bookingData.totalPrice} kr
- Email skickat: Ja
- SMS skickat: Ja
${bookingId ? `- Boknings-ID: ${bookingId}` : ''}
    `.trim();

    const { data: customer } = await supabase
      .from('customers')
      .select('notes')
      .eq('id', customerId)
      .single();

    const existingNotes = customer?.notes || '';
    const updatedNotes = existingNotes 
      ? `${existingNotes}\n\n---\n\n${communicationNote}`
      : communicationNote;

    await supabase
      .from('customers')
      .update({ 
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    console.log('✅ Logged communication');
  } catch (error) {
    console.error('❌ Communication logging failed:', error);
  }
}

/**
 * Trigger AI customer service system
 * Non-blocking - failures won't affect main booking flow
 */
async function triggerAICustomerService(
  customerId: string,
  bookingData: BookingData,
  bookingId?: string
): Promise<boolean> {
  try {
    // Trigger new customer onboarding workflow
    const onboardingResponse = await fetch('/api/ai-customer-service/identify/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: bookingData.email,
        phone: bookingData.phone,
        name: bookingData.name,
        context: 'new_booking',
        metadata: {
          bookingId,
          serviceTypes: bookingData.serviceTypes,
          moveDate: bookingData.moveDate,
          totalPrice: bookingData.totalPrice
        }
      })
    });

    if (!onboardingResponse.ok) {
      console.warn('⚠️ AI onboarding trigger failed:', await onboardingResponse.text());
      return false;
    }

    // Track analytics event
    await fetch('/api/ai-customer-service/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'booking_created',
        customerId,
        properties: {
          bookingId,
          serviceTypes: bookingData.serviceTypes,
          value: bookingData.totalPrice,
          source: 'booking_form'
        }
      })
    });

    console.log('✅ AI customer service triggered');
    return true;
  } catch (error) {
    console.error('⚠️ AI trigger failed (non-critical):', error);
    return false;
  }
}

/**
 * Handle booking confirmation from email link
 */
export async function confirmBookingFromEmail(
  bookingId: string,
  confirmationToken: string
): Promise<CRMSyncResult> {
  console.log('🔄 confirmBookingFromEmail called with:', { bookingId, tokenProvided: !!confirmationToken });
  
  try {
    // Normalize the booking reference to handle both NF- format and UUID
    const { displayFormat, uuidFormat, searchPattern } = normalizeBookingReference(bookingId);
    
    console.log('📋 Looking for booking:', {
      original: bookingId,
      display: displayFormat,
      uuid: uuidFormat,
      pattern: searchPattern
    });
    
    // Try multiple search strategies
    let booking = null;
    
    // Strategy 1: Direct UUID match
    if (uuidFormat) {
      const { data: uuidMatch, error: uuidError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', uuidFormat)
        .single();
      
      if (!uuidError && uuidMatch) {
        booking = uuidMatch;
        console.log('✅ Found by UUID match');
      }
    }
    
    // Strategy 2: Pattern match on ID
    if (!booking) {
      const { data: patternMatches, error: patternError } = await supabase
        .from('bookings')
        .select('*')
        .ilike('id', `${searchPattern}%`);
      
      if (!patternError && patternMatches && patternMatches.length > 0) {
        booking = patternMatches[0];
        console.log('✅ Found by pattern match');
      }
    }
    
    // Strategy 3: Check if there's a reference column
    if (!booking) {
      const { data: refMatches, error: refError } = await supabase
        .from('bookings')
        .select('*')
        .or(`reference.eq.${bookingId},reference.eq.${displayFormat}`);
      
      if (!refError && refMatches && refMatches.length > 0) {
        booking = refMatches[0];
        console.log('✅ Found by reference column');
      }
    }

    if (!booking) {
      console.error('❌ Booking not found with ID/reference:', bookingId);
      return {
        success: false,
        errors: [`Booking not found with ID/reference: ${bookingId}`]
      };
    }

    console.log('✅ Booking found:', {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      customer_id: booking.customer_id
    });

    // Update booking status - MINIMAL, only status field
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed'  // ONLY status - no confirmed_at column!
      })
      .eq('id', booking.id);

    // Update lead status to converted (not just qualified)
    const { updateLeadToConverted } = require('@/lib/utils/crm-lifecycle');
    const leadUpdate = await updateLeadToConverted(booking.id, booking.customer_id);
    
    if (leadUpdate.success) {
      console.log('✅ Lead status updated to converted');
    } else {
      console.log('⚠️ Lead status update failed:', leadUpdate.error);
    }

    // 🔄 CREATE JOB FROM ACCEPTED BOOKING
    console.log('🚀 Creating job from accepted booking...');
    
    try {
      // Use the fallback job creation utility
      const jobResult = await createJobWithFallback(supabase, booking);
      
      if (jobResult.success && jobResult.jobId) {
        console.log('✅ Job created:', jobResult.jobId);
        
        // Update booking with job reference
        await supabase
          .from('bookings')
          .update({ job_id: jobResult.jobId })
          .eq('id', booking.id);
      } else {
        console.error('❌ Job creation failed:', jobResult.error);
      }
    } catch (error) {
      console.error('⚠️ Job creation failed (non-critical):', error);
    }

    // Trigger AI for confirmation workflow
    if (booking.customer_id) {
      await triggerAICustomerService(
        booking.customer_id,
        {
          name: booking.customer_name || '',
          email: booking.customer_email || '',
          phone: booking.customer_phone || '',
          customerType: 'confirmed',
          serviceType: booking.service_type,
          serviceTypes: booking.service_types,
          moveDate: booking.move_date,
          moveTime: booking.move_time,
          startAddress: booking.start_address,
          endAddress: booking.end_address,
          totalPrice: booking.total_price
        },
        booking.id
      );
    }

    return {
      success: true,
      bookingId: booking.id,
      customerId: booking.customer_id
    };
  } catch (error) {
    console.error('❌ Booking confirmation failed:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Update booking status in CRM
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
  notes?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw error;

    // Log status change
    const { data: booking } = await supabase
      .from('bookings')
      .select('customer_id')
      .eq('id', bookingId)
      .single();

    if (booking?.customer_id && notes) {
      await logCommunication(
        booking.customer_id,
        { status, notes } as any,
        bookingId
      );
    }

    console.log('✅ Updated booking status:', { bookingId, status });
    return true;
  } catch (error) {
    console.error('❌ Status update failed:', error);
    return false;
  }
}