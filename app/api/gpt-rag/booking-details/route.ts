import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

// API Key validation
async function validateApiKey(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  const validApiKey = process.env.NORDFLYTT_GPT_API_KEY || 'nordflytt_gpt_api_key_2025';
  return token === validApiKey;
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!await validateApiKey(request)) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Invalid API key for Custom GPT access'
        },
        { status: 401 }
      );
    }

    const { customer_email, booking_date, booking_id } = await request.json();
    
    if (!customer_email && !booking_id) {
      return NextResponse.json(
        { error: 'Customer email or booking ID required' },
        { status: 400 }
      );
    }
    
    // Mock data for testing
    if (!supabase) {
      return NextResponse.json(getMockBookingData(customer_email, booking_id));
    }
    
    // Build query
    let query = supabase.from('jobs').select(`
      *,
      customers!inner (
        id,
        name,
        email
      )
    `);
    
    if (booking_id) {
      // Try to match booking reference format
      query = query.or(`id.eq.${booking_id},reference_number.eq.${booking_id}`);
    } else if (customer_email) {
      query = query.eq('customers.email', customer_email);
      
      if (booking_date) {
        const searchDate = new Date(booking_date);
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
        
        query = query
          .gte('scheduled_date', startOfDay.toISOString())
          .lte('scheduled_date', endOfDay.toISOString());
      }
    }
    
    // Get the most recent booking if multiple exist
    query = query.order('scheduled_date', { ascending: false }).limit(1);
    
    const { data: bookings, error } = await query;
    
    if (error || !bookings || bookings.length === 0) {
      return NextResponse.json({
        booking_found: false,
        error_message: "Ingen bokning hittades med dessa uppgifter",
        suggested_response: "Jag kunde inte hitta någon bokning. Kan du ge mig ditt bokningsnummer eller datum?"
      });
    }
    
    const booking = bookings[0];
    const services = booking.services || [];
    
    // Check for specific services
    const hasPacking = services.includes('packning') || booking.packed_by_nordflytt;
    const hasCleaning = services.includes('städning');
    const hasBoxes = services.includes('kartonger') || services.includes('flyttkartonger');
    const hasStorage = services.includes('magasinering') || services.includes('förvaring');
    
    // Calculate if photos should be available
    const bookingDate = new Date(booking.scheduled_date);
    const today = new Date();
    const photosAvailable = booking.status === 'completed' && 
                          (today.getTime() - bookingDate.getTime()) < (30 * 24 * 60 * 60 * 1000); // Within 30 days
    
    return NextResponse.json({
      booking_found: true,
      booking_data: {
        booking_id: booking.id,
        reference_number: booking.reference_number || `BK-${booking.id.substring(0, 8).toUpperCase()}`,
        date: booking.scheduled_date,
        services: services,
        total_amount: booking.total_amount || 0,
        status: booking.status,
        packed_by_nordflytt: hasPacking,
        photos_available: photosAvailable,
        from_address: booking.from_address,
        to_address: booking.to_address,
        volume_m3: booking.volume_m3
      },
      service_context: {
        has_packing_service: hasPacking,
        has_cleaning: hasCleaning,
        has_boxes: hasBoxes,
        has_storage: hasStorage
      },
      additional_info: {
        can_modify: booking.status === 'confirmed' && bookingDate > today,
        can_cancel: booking.status === 'confirmed' && 
                   (bookingDate.getTime() - today.getTime()) > (48 * 60 * 60 * 1000), // More than 48h
        invoice_sent: booking.invoice_sent || false,
        payment_status: booking.payment_status || 'pending'
      }
    });
    
  } catch (error: any) {
    console.error('Booking details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch booking details' },
      { status: 500 }
    );
  }
}

function getMockBookingData(email: string, bookingId?: string) {
  // Mock responses for testing
  if (email === 'anna.svensson@gmail.com' || bookingId === 'BK-2024-001234') {
    return {
      booking_found: true,
      booking_data: {
        booking_id: '12345678-1234-1234-1234-123456789012',
        reference_number: 'BK-2024-001234',
        date: '2024-12-15',
        services: ['flytt', 'packning', 'städning'],
        total_amount: 8500,
        status: 'completed',
        packed_by_nordflytt: true,
        photos_available: true,
        from_address: 'Vasagatan 10, Stockholm',
        to_address: 'Östermalm 25, Stockholm',
        volume_m3: 25
      },
      service_context: {
        has_packing_service: true,
        has_cleaning: true,
        has_boxes: false,
        has_storage: false
      },
      additional_info: {
        can_modify: false,
        can_cancel: false,
        invoice_sent: true,
        payment_status: 'paid'
      }
    };
  }
  
  return {
    booking_found: false,
    error_message: "Ingen bokning hittades med dessa uppgifter",
    suggested_response: "Jag kunde inte hitta någon bokning. Kan du ge mig ditt bokningsnummer eller datum?"
  };
}