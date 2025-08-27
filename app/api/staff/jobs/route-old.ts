import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getStaffJobs, seedDemoData } from '@/lib/database/staff-operations';
import { testConnection } from '@/lib/database/supabase-client';

export async function GET(request: NextRequest) {
  return authMiddleware(request, async (req: AuthenticatedRequest) => {
    try {
      // Get query parameters
      const searchParams = request.nextUrl.searchParams;
      const dateFilter = searchParams.get('date');
      const staffId = req.user?.userId;
    
    // Get today's date to filter relevant jobs
    const today = dateFilter || new Date().toISOString().split('T')[0];
    
    // Fetch all recent jobs based on created_at since some might not have scheduled_date
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days to ensure we catch all relevant jobs
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (jobsError) {
      console.error('Database error:', jobsError);
      throw jobsError;
    }
    
    // Transform database jobs to staff app format
    const staffJobs = await Promise.all((jobs || []).map(async (job) => {
      // Fetch customer details
      const { data: customer } = await supabase
        .from('customers')
        .select('name, phone, email')
        .eq('id', job.customer_id)
        .single();
      
      // Try to extract booking ID from title if present
      let bookingDetails = null;
      const bookingIdMatch = job.title?.match(/\[([a-f0-9-]+)\]$/);
      const bookingId = bookingIdMatch ? bookingIdMatch[1] : job.quote_id;
      
      if (bookingId) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();
        bookingDetails = booking;
      }
      
      // If no booking found by ID, try to find by customer and date
      if (!bookingDetails && job.customer_id && job.scheduled_date) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('customer_id', job.customer_id)
          .eq('move_date', job.scheduled_date)
          .order('created_at', { ascending: false })
          .limit(1);
        
        bookingDetails = bookings?.[0] || null;
      }
      
      // Extract job number from title if it exists
      const jobNumberMatch = job.title?.match(/^(JOB\d+)/);
      const jobNumber = jobNumberMatch ? jobNumberMatch[1] : `JOB${job.id.slice(0, 8)}`;
      
      // Get services from booking or default
      const services = bookingDetails?.service_types || ['moving'];
      
      // Map service types to Swedish names
      const serviceMap = {
        'moving': 'Flytt',
        'packing': 'Packhjälp',
        'cleaning': 'Flyttstädning',
        'storage': 'Magasinering'
      };
      
      const mappedServices = services.map(s => serviceMap[s] || s);
      
      // Get move time from booking or default
      const startTime = bookingDetails?.move_time || '09:00';
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      const estimatedHours = bookingDetails?.details?.timeEstimation?.mlPrediction || 4;
      const endDate = new Date(startDate.getTime() + estimatedHours * 60 * 60 * 1000);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      
      return {
        id: job.id,
        bookingNumber: jobNumber,
        customerName: customer?.name || 'Okänd kund',
        customerPhone: customer?.phone || '',
        fromAddress: bookingDetails?.start_address || 'Hämtadress saknas',
        toAddress: bookingDetails?.end_address || 'Lämnadress saknas',
        moveDate: bookingDetails?.move_date || job.scheduled_date || new Date().toISOString().split('T')[0],
        moveTime: startTime,
        endTime: endTime,
        status: mapJobStatus(job.status),
        estimatedHours: estimatedHours,
        teamMembers: ['Personal 1', 'Personal 2'],
        priority: 'medium',
        distance: 5,
        serviceType: services[0] || 'moving',
        services: mappedServices,
        specialRequirements: bookingDetails?.special_instructions ? [bookingDetails.special_instructions] : [],
        locationInfo: {
          doorCode: '',
          floor: bookingDetails?.start_floor || 1,
          elevator: bookingDetails?.start_elevator !== false,
          elevatorStatus: 'Fungerar',
          parkingDistance: bookingDetails?.start_parking_distance || 10,
          accessNotes: ''
        },
        customerNotes: bookingDetails?.special_instructions || '',
        equipment: ['Flyttselar', 'Kartonger', 'Filtar'],
        volume: 20,
        boxCount: 10
      };
    }));
    
    // Filter jobs by moveDate if date filter is provided
    const filteredJobs = today ? staffJobs.filter(job => job.moveDate === today) : staffJobs;
    
    console.log(`Filtering jobs for date ${today}: ${filteredJobs.length} of ${staffJobs.length} jobs match`);
    
    return NextResponse.json({
      success: true,
      jobs: filteredJobs,
      message: 'Jobs loaded successfully'
    });
    } catch (error: any) {
      console.error('Staff jobs API error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch jobs',
        details: error.message
      }, { status: 500 });
    }
  });
}

// Helper function to map job status
function mapJobStatus(dbStatus: string): 'upcoming' | 'in_progress' | 'completed' {
  switch (dbStatus) {
    case 'scheduled':
    case 'pending':
      return 'upcoming';
    case 'in_progress':
    case 'active':
      return 'in_progress';
    case 'completed':
    case 'done':
      return 'completed';
    default:
      return 'upcoming';
  }
}