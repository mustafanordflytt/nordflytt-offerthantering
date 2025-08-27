/**
 * Synchronize offer status across CRM sections
 * Ensures consistency between Offerter and Uppdrag sections
 */

export interface OfferStatusUpdate {
  offerId: string;
  newStatus: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  updatedBy?: string;
}

/**
 * Map booking status to offer status
 */
export function getOfferStatusFromBooking(bookingStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Skickad',
    'confirmed': 'Godkänd',      // When booking is confirmed, offer is accepted
    'in_progress': 'Godkänd',     // Still accepted during job
    'completed': 'Godkänd',       // Remains accepted after completion
    'cancelled': 'Avvisad'        // If booking cancelled, offer rejected
  };
  
  return statusMap[bookingStatus] || 'Skickad';
}

/**
 * Update offer status when booking status changes
 */
export async function syncOfferStatus(
  supabase: any, 
  bookingId: string, 
  newBookingStatus: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 Syncing offer status for booking:', bookingId);
    
    // Get the offer ID from booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('offer_id, reference')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      console.error('Failed to find booking:', bookingError);
      return { success: false, error: 'Booking not found' };
    }
    
    // Map booking status to offer status
    const newOfferStatus = getOfferStatusFromBooking(newBookingStatus);
    
    // Update offer status (if there's an offers table)
    if (booking.offer_id) {
      const { error: offerError } = await supabase
        .from('offers')
        .update({
          status: newOfferStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.offer_id);
      
      if (offerError) {
        console.error('Failed to update offer:', offerError);
        // Don't fail the whole operation if offer update fails
      } else {
        console.log(`✅ Offer status updated to: ${newOfferStatus}`);
      }
    }
    
    // Also update the booking's internal offer status for display
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        'details': supabase.rpc('jsonb_set', [
          'details',
          '{offerStatus}',
          JSON.stringify(newOfferStatus)
        ])
      })
      .eq('id', bookingId);
    
    if (updateError) {
      // If jsonb_set doesn't work, try simpler approach
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('details')
        .eq('id', bookingId)
        .single();
      
      const updatedDetails = {
        ...(currentBooking?.details || {}),
        offerStatus: newOfferStatus
      };
      
      await supabase
        .from('bookings')
        .update({ details: updatedDetails })
        .eq('id', bookingId);
    }
    
    console.log(`✅ Booking offer status synced: ${newBookingStatus} → ${newOfferStatus}`);
    return { success: true };
    
  } catch (error) {
    console.error('Error syncing offer status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get consistent status display across CRM
 */
export function getStatusDisplay(status: string, section: 'offer' | 'job'): string {
  if (section === 'offer') {
    // Offer statuses in Swedish
    const offerStatuses: Record<string, string> = {
      'draft': 'Utkast',
      'sent': 'Skickad',
      'accepted': 'Godkänd',
      'rejected': 'Avvisad',
      'expired': 'Utgången'
    };
    return offerStatuses[status] || status;
  } else {
    // Job statuses in Swedish
    const jobStatuses: Record<string, string> = {
      'scheduled': 'Planerad',
      'in_progress': 'Pågående',
      'completed': 'Slutförd',
      'cancelled': 'Avbruten'
    };
    return jobStatuses[status] || status;
  }
}