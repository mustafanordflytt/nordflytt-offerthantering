/**
 * EXACT job structure that matches working jobs in the system
 * Based on Anna Andersson job and other working examples
 */

export interface WorkingJobStructure {
  bookingNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerType: 'private' | 'business';
  fromAddress: string;
  toAddress: string;
  moveDate: string;
  moveTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  totalPrice: number;
  distance?: number;
  estimatedHours: number;
  estimatedVolume?: number;
  services: string[];
  notes: string;
  assignedStaff?: any[];
  actualHours?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a job using the EXACT structure of working jobs
 */
export function createWorkingJobData(booking: any): WorkingJobStructure {
  // Null safety check
  if (!booking) {
    throw new Error('Cannot create job data: booking is null');
  }
  
  // Calculate priority based on move date
  const moveDate = booking.move_date ? new Date(booking.move_date) : new Date();
  const daysUntilMove = Math.ceil((moveDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  let priority: 'low' | 'medium' | 'high' = 'medium';
  if (daysUntilMove <= 1) priority = 'high';
  else if (daysUntilMove <= 7) priority = 'medium';
  else priority = 'low';

  // Use enhanced team-based time calculation
  const { calculateEnhancedEstimatedTime } = require('./enhanced-time-estimation');
  
  // Convert elevator info to type format
  const elevatorTypeFrom = booking.details?.startElevator === 'hiss' ? 'stor' : 
                          booking.details?.startElevator === 'small' ? 'liten' : 'ingen';
  const elevatorTypeTo = booking.details?.endElevator === 'hiss' ? 'stor' : 
                        booking.details?.endElevator === 'small' ? 'liten' : 'ingen';
  
  const timeEstimation = calculateEnhancedEstimatedTime({
    volume: booking.details?.estimatedVolume || 20,
    distance: parseFloat(booking.details?.calculatedDistance) || 10,
    teamSize: 2, // Default team size
    propertyType: booking.details?.startPropertyType === 'house' ? 'villa' : 'lägenhet',
    livingArea: parseInt(booking.details?.startLivingArea) || 70,
    floors: {
      from: parseInt(booking.details?.startFloor) || 0,
      to: parseInt(booking.details?.endFloor) || 0
    },
    elevatorType: {
      from: elevatorTypeFrom,
      to: elevatorTypeTo
    },
    parkingDistance: {
      from: parseInt(booking.details?.startParkingDistance) || 0,
      to: parseInt(booking.details?.endParkingDistance) || 0
    },
    services: booking.service_types || ['moving'],
    trafficFactor: 'normal'
  });
  const estimatedHours = timeEstimation.totalHours;

  // Safe booking number generation
  let bookingNumber = booking.reference;
  if (!bookingNumber && booking.id) {
    bookingNumber = `NF-${booking.id.slice(0, 8).toUpperCase()}`;
  }
  if (!bookingNumber) {
    bookingNumber = `NF-${Date.now().toString(36).toUpperCase()}`;
  }

  return {
    bookingNumber: bookingNumber,
    customerId: booking.customer_id || '',
    customerName: booking.customer_name || booking.details?.name || 'Unknown',
    customerEmail: booking.customer_email || booking.details?.email || '',
    customerPhone: booking.customer_phone || booking.details?.phone || '',
    customerType: booking.customer_type === 'business' ? 'business' : 'private',
    fromAddress: booking.start_address || booking.details?.startAddress || '',
    toAddress: booking.end_address || booking.details?.endAddress || '',
    moveDate: new Date(booking.move_date).toISOString(),
    moveTime: booking.move_time || '09:00',
    status: 'scheduled',
    priority: priority,
    totalPrice: booking.total_price || 0,
    distance: parseFloat(booking.details?.calculatedDistance) || 0,
    estimatedHours: estimatedHours,
    estimatedVolume: booking.details?.estimatedVolume || 20,
    services: booking.service_types || ['moving'],
    notes: booking.details?.specialInstructions || '',
    assignedStaff: [],
    actualHours: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a job using the CORRECT approach - just update booking status
 */
export async function createJobWithFallback(supabase: any, booking: any): Promise<{ success: boolean; jobId?: string; error?: string }> {
  // NULL SAFETY CHECK
  if (!booking || !booking.id) {
    console.error('❌ Cannot create job: booking is null or missing id');
    return {
      success: false,
      error: 'Invalid booking: missing required data'
    };
  }
  
  console.log('🎯 Creating job CORRECTLY - no customer_name column needed!');
  console.log('📋 Booking to convert:', {
    id: booking.id,
    reference: booking.reference || 'none',
    customer_id: booking.customer_id || 'none',
    current_status: booking.status || 'unknown'
  });
  
  // Jobs are just bookings with confirmed status!
  // No need to insert customer_name or modify table structure
  
  try {
    // MINIMAL UPDATE - Only change status, nothing else!
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed'  // ONLY THIS - no other columns!
      })
      .eq('id', booking.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update booking status:', updateError);
      return { 
        success: false, 
        error: updateError.message 
      };
    }

    if (updatedBooking) {
      console.log('✅ Job created successfully!');
      console.log('📍 Booking is now a job with status:', updatedBooking.status);
      console.log('🔍 It will appear in /crm/uppdrag when fetched with customer join');
      
      // Sync offer status to "Godkänd" when booking is confirmed
      const { syncOfferStatus } = require('./offer-status-sync');
      const offerSync = await syncOfferStatus(supabase, booking.id, 'confirmed');
      if (offerSync.success) {
        console.log('✅ Offer status updated to Godkänd');
      } else {
        console.log('⚠️ Offer status sync failed:', offerSync.error);
      }
      
      // The job structure is created by the API when displaying, not stored
      const displayData = createWorkingJobData(booking);
      console.log('📋 Job will display as:', {
        bookingNumber: displayData.bookingNumber,
        customerName: displayData.customerName, // This comes from customer join!
        fromAddress: displayData.fromAddress,
        toAddress: displayData.toAddress,
        estimatedHours: displayData.estimatedHours + ' timmar'
      });
      
      return { success: true, jobId: updatedBooking.id };
    }

    return { 
      success: false, 
      error: 'No booking returned after update' 
    };

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}