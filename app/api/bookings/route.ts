import { NextRequest, NextResponse } from 'next/server';

// Mock database for bookings
let mockBookings: any[] = [];
let bookingIdCounter = 1000;

// Pricing configuration from CLAUDE.md
const PRICING = {
  volumeAdjustment: 240,      // kr/m³ efter RUT-avdrag
  parkingDistance: 99,        // kr/meter över 5m
  materials: {
    boxes: 79,                // flyttkartonger
    tape: 99,                 // packtejp
    plasticBags: 20          // plastpåsar
  },
  stairs: {
    noElevator: 500,         // fast avgift våning 3+
    brokenElevator: 300      // trasig hiss
  }
};

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();
    
    // Validate booking data
    const validatedData = validateBookingData(bookingData);
    
    // Calculate pricing using business rules
    const pricing = calculateBookingPrice(validatedData);
    
    // Create booking
    const booking = {
      id: `BOOK${++bookingIdCounter}`,
      ...validatedData,
      ...pricing,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save to mock database
    mockBookings.push(booking);
    
    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      total_price: pricing.total,
      estimated_time: pricing.estimated_hours,
      message: 'Booking created successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Booking creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create booking',
      details: error.message
    }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');
    
    if (bookingId) {
      const booking = mockBookings.find(b => b.id === bookingId);
      if (!booking) {
        return NextResponse.json({
          success: false,
          error: 'Booking not found'
        }, { status: 404 });
      }
      return NextResponse.json({ success: true, booking });
    }
    
    // Return all bookings
    return NextResponse.json({ 
      success: true, 
      bookings: mockBookings,
      total: mockBookings.length
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve bookings'
    }, { status: 500 });
  }
}

function validateBookingData(data: any) {
  const required = ['customer_name', 'customer_email', 'moving_date', 'from_address', 'to_address', 'volume'];
  const missing = [];
  
  for (const field of required) {
    if (!data[field]) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.customer_email)) {
    throw new Error('Invalid email format');
  }
  
  // Validate volume is a positive number
  if (typeof data.volume !== 'number' || data.volume <= 0) {
    throw new Error('Volume must be a positive number');
  }
  
  return data;
}

function calculateBookingPrice(data: any) {
  // Base price calculation
  let subtotal = data.volume * PRICING.volumeAdjustment;
  
  // Add parking fee if distance > 5m
  let parkingFee = 0;
  if (data.parking_distance && data.parking_distance > 5) {
    parkingFee = (data.parking_distance - 5) * PRICING.parkingDistance;
    subtotal += parkingFee;
  }
  
  // Add stairs fee
  let stairsFee = 0;
  if (data.stairs_from && data.stairs_from > 2 && !data.elevator_from) {
    stairsFee += PRICING.stairs.noElevator;
  }
  if (data.stairs_to && data.stairs_to > 2 && !data.elevator_to) {
    stairsFee += PRICING.stairs.noElevator;
  }
  if (data.elevator_broken_from) {
    stairsFee += PRICING.stairs.brokenElevator;
  }
  if (data.elevator_broken_to) {
    stairsFee += PRICING.stairs.brokenElevator;
  }
  subtotal += stairsFee;
  
  // Add materials cost
  let materialsCost = 0;
  if (data.materials) {
    materialsCost += (data.materials.boxes || 0) * PRICING.materials.boxes;
    materialsCost += (data.materials.tape || 0) * PRICING.materials.tape;
    materialsCost += (data.materials.plasticBags || 0) * PRICING.materials.plasticBags;
  }
  subtotal += materialsCost;
  
  // Calculate estimated hours (minimum 2 hours)
  const estimated_hours = Math.max(2, Math.ceil(data.volume * 0.5));
  
  return {
    subtotal: Math.round(subtotal),
    total: Math.round(subtotal),
    estimated_hours,
    breakdown: {
      volume_cost: Math.round(data.volume * PRICING.volumeAdjustment),
      parking_fee: Math.round(parkingFee),
      stairs_fee: stairsFee,
      materials_cost: materialsCost
    }
  };
}