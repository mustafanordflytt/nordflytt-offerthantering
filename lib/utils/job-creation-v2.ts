/**
 * CRITICAL DISCOVERY:
 * - Jobs are just bookings with status: confirmed/in_progress/completed
 * - bookings table does NOT have customer_name column
 * - Customer name comes from related customers table via customer_id
 * - Jobs are displayed by transforming booking data, NOT stored separately
 */

export interface JobDisplay {
  bookingNumber: string;
  customerName: string;
  fromAddress: string;
  toAddress: string;
  moveDate: string;
  moveTime: string;
  status: string;
  priority: string;
  totalPrice: number;
}

/**
 * Create a job by simply updating booking status to confirmed
 * This is how existing jobs (Anna Andersson, Företaget AB) work
 */
export async function createJobCorrectly(supabase: any, bookingId: string): Promise<{ success: boolean; error?: string }> {
  console.log('🎯 Creating job the CORRECT way - just update booking status');
  
  try {
    // Step 1: Get the booking with customer info
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(
          id,
          name,
          email,
          phone,
          customer_type
        )
      `)
      .eq('id', bookingId)
      .single();
    
    if (fetchError || !booking) {
      console.error('❌ Failed to fetch booking:', fetchError);
      return { success: false, error: 'Booking not found' };
    }
    
    console.log('📋 Found booking:', {
      id: booking.id,
      customer_id: booking.customer_id,
      customer_name: booking.customer?.name, // This is how we get the name!
      status: booking.status
    });
    
    // Step 2: Update booking status to confirmed (this makes it a job)
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed'  // MINIMAL UPDATE - only status!
      })
      .eq('id', bookingId);
    
    if (updateError) {
      console.error('❌ Failed to update booking status:', updateError);
      return { success: false, error: updateError.message };
    }
    
    console.log('✅ Job created successfully by confirming booking');
    console.log('📍 Job will appear in /crm/uppdrag with:');
    console.log(`   - Booking Number: ${booking.reference || 'NF-' + booking.id.slice(0, 8).toUpperCase()}`);
    console.log(`   - Customer Name: ${booking.customer?.name || 'Unknown'}`);
    console.log(`   - Route: ${booking.start_address} → ${booking.end_address}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get job display data (how it appears in UI)
 * This mimics the transformation in /api/crm/jobs
 */
export function getJobDisplayData(booking: any): JobDisplay {
  // Calculate priority
  const moveDate = new Date(booking.move_date);
  const daysUntilMove = Math.ceil((moveDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  let priority: 'low' | 'medium' | 'high' = 'medium';
  if (daysUntilMove <= 1) priority = 'high';
  else if (daysUntilMove <= 7) priority = 'medium';
  else priority = 'low';
  
  return {
    bookingNumber: booking.reference || `NF-${booking.id.slice(0, 8).toUpperCase()}`,
    customerName: booking.customer?.name || booking.details?.name || 'Unknown',
    fromAddress: booking.start_address || '',
    toAddress: booking.end_address || '',
    moveDate: booking.move_date,
    moveTime: booking.move_time || '09:00',
    status: booking.status === 'confirmed' ? 'scheduled' : booking.status,
    priority: priority,
    totalPrice: booking.total_price || 0
  };
}