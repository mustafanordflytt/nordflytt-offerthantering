import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClientComponentClient();
    
    // Generera ett unikt ID
    const testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    // Skapa en test-bokning med faktura som betalmetod
    const testBooking = {
      id: testId,
      customer_name: 'Test Testsson',
      email: 'test@example.com',
      phone: '0701234567',
      status: 'pending',
      total_price: 8500,
      start_address: 'Testgatan 1, 111 11 Stockholm',
      end_address: 'Provvägen 2, 222 22 Stockholm',
      move_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dagar fram
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      details: {
        customerType: 'private', // Privatperson för att trigga BankID
        paymentMethod: 'invoice', // Faktura för att trigga kreditkontroll
        moveTime: '08:00',
        startPropertyType: 'apartment',
        endPropertyType: 'apartment',
        startLivingArea: 75,
        endLivingArea: 85,
        startFloor: '2',
        endFloor: '3',
        startElevator: 'small',
        endElevator: 'big',
        estimatedVolume: 25,
        calculatedDistance: 15,
        startParkingDistance: '10',
        endParkingDistance: '5',
        movingBoxes: 20,
        needsMovingBoxes: true,
        packingService: 'Nej tack',
        cleaningService: 'Nej tack',
        additionalServices: []
      }
    };

    console.log('Attempting to create test booking:', testBooking);

    // Spara i databasen
    const { data, error } = await supabase
      .from('bookings')
      .insert(testBooking)
      .select()
      .single();

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Om det är ett anslutningsfel, returnera en mock-offert istället
      if (error.message.includes('Failed to fetch') || error.code === 'PGRST301') {
        console.log('Database connection failed, returning mock offer ID');
        return NextResponse.json({ 
          success: true, 
          offerId: testId,
          message: `Mock test-offert skapad! Gå till /offer/${testId}`,
          mock: true,
          note: 'Database är inte ansluten, använder mock-data'
        });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create test booking', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      offerId: data.id,
      message: `Test-offert skapad! Gå till /offer/${data.id}`,
      mock: false
    });

  } catch (error) {
    console.error('Error creating test offer:', error);
    
    // Returnera en mock-offert vid fel
    const mockId = `mock-${Date.now()}`;
    return NextResponse.json({ 
      success: true, 
      offerId: mockId,
      message: `Mock test-offert skapad! Gå till /offer/${mockId}`,
      mock: true,
      note: 'Ett fel uppstod, använder mock-data'
    });
  }
}