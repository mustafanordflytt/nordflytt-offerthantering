/**
 * Helper for 3-Perspective Demo Script
 * Provides correct API format for booking creation
 */

// Function to create booking with demo format
async function createDemoBooking(demoData) {
  // Map demo format to API format
  const apiData = {
    // Customer info - map field names
    name: demoData.customer_name,
    email: demoData.customer_email,
    phone: demoData.customer_phone,
    customerType: 'private',
    
    // Service configuration
    serviceType: 'moving',
    serviceTypes: demoData.services.map(service => {
      const serviceMap = {
        'packhjälp': 'packing',
        'flytt': 'moving',
        'flyttstädning': 'cleaning'
      };
      return serviceMap[service] || service;
    }),
    
    // Moving details
    moveDate: demoData.moving_date,
    moveTime: '09:00',
    startAddress: demoData.from_address,
    endAddress: demoData.to_address,
    
    // Floor information
    startFloor: String(demoData.floors || 1),
    endFloor: String(demoData.target_floors || 1),
    startElevator: 'true',
    endElevator: 'true',
    
    // Parking distances
    startParkingDistance: String(demoData.parking_distance_from || 5),
    endParkingDistance: String(demoData.parking_distance_to || 5),
    
    // Living area (estimate from volume)
    startLivingArea: String(Math.round((demoData.volume || 25) * 3)),
    endLivingArea: String(Math.round((demoData.volume || 25) * 3)),
    
    // Volume and special requirements
    estimatedVolume: demoData.volume || 25,
    specialInstructions: demoData.special_requirements || '',
    
    // Materials if specified
    movingBoxes: demoData.boxes,
    
    // Required fields
    paymentMethod: 'invoice',
    additionalServices: demoData.boxes ? ['packingMaterial'] : []
  };
  
  // Make the API call
  const response = await fetch('http://localhost:3000/api/submit-booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apiData)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Booking failed: ${error}`);
  }
  
  return await response.json();
}

// Example usage for your demo
async function runDemoBooking() {
  const demoData = {
    customer_name: "Anna Svensson",
    customer_email: "anna.svensson@email.se",
    customer_phone: "+46 70 123 4567",
    from_address: "Hornsgatan 45, 118 49 Stockholm (Södermalm)",
    to_address: "Östermalmsvägen 12, 114 39 Stockholm (Östermalm)",
    moving_date: "2025-08-20",
    volume: 25,
    floors: 2,
    target_floors: 3,
    parking_distance_from: 10,
    parking_distance_to: 5,
    services: ["packhjälp", "flytt", "flyttstädning"],
    boxes: 40,
    tape: 3,
    plastic_bags: 15,
    special_requirements: "Piano transport, fragile artwork, vintage furniture"
  };
  
  try {
    console.log('Creating booking for Anna Svensson...');
    const result = await createDemoBooking(demoData);
    
    console.log('✅ Booking created successfully!');
    console.log('Booking ID:', result.bookingId);
    console.log('Customer ID:', result.customerId);
    console.log('Reference:', result.bookingReference);
    console.log('Total Price:', result.totalPrice, 'SEK');
    
    return result;
  } catch (error) {
    console.error('❌ Booking failed:', error.message);
    throw error;
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createDemoBooking, runDemoBooking };
}

// Run demo if called directly
if (require.main === module) {
  runDemoBooking();
}