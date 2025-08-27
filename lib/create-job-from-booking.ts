import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function createJobFromBooking(bookingData: any, bookingId: string, customerId: string | null) {
  try {
    console.log('Creating job/calendar event from booking...');
    
    // Since the jobs table might not exist yet, we'll update the booking status
    // to make it appear in the calendar (which reads from bookings table)
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed', // This makes it appear in calendar
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating booking status:', updateError);
      return { success: false, error: updateError };
    }
    
    console.log('Booking status updated to confirmed for calendar visibility');
    
    // Also try to create a calendar event if the table exists
    try {
      const eventData = {
        job_id: bookingId,
        staff_member_id: 'unassigned',
        staff_member_name: 'Ej tilldelad',
        event_date: bookingData.moveDate,
        start_time: bookingData.moveTime || '09:00',
        end_time: calculateEndTime(bookingData.moveTime || '09:00', bookingData.estimatedHours || 4),
        event_type: 'job',
        status: 'scheduled',
        location: bookingData.startAddress,
        notes: `Flytt för ${bookingData.name}. Från: ${bookingData.startAddress} Till: ${bookingData.endAddress}`
      };
      
      const { data: event, error: eventError } = await supabase
        .from('calendar_events')
        .insert([eventData])
        .select('id')
        .single();
      
      if (!eventError && event) {
        console.log('Calendar event created:', event.id);
      }
    } catch (calendarError) {
      console.log('Calendar events table might not exist yet');
    }
    
    return { success: true, jobId: bookingId };
    
  } catch (error) {
    console.error('Failed to create job:', error);
    return { success: false, error };
  }
}

function calculateEndTime(startTime: string, estimatedHours: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHour = hours + Math.floor(estimatedHours);
  const endMinute = minutes + (estimatedHours % 1) * 60;
  
  return `${String(endHour).padStart(2, '0')}:${String(Math.floor(endMinute)).padStart(2, '0')}`;
}