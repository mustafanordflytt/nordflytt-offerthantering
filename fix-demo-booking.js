/**
 * Fix for 3-Perspective Demo Booking API
 * Maps demo data format to actual API format
 */

// Your demo data format
const DEMO_DATA = {
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

// Convert to API format
function convertToAPIFormat(demoData) {
  return {
    // Basic customer info
    name: demoData.customer_name,
    email: demoData.customer_email,
    phone: demoData.customer_phone,
    customerType: 'private',
    
    // Service info
    serviceType: 'moving',
    serviceTypes: demoData.services.map(s => {
      // Map Swedish service names to expected format
      const serviceMap = {
        'packhjälp': 'packing',
        'flytt': 'moving',
        'flyttstädning': 'cleaning'
      };
      return serviceMap[s] || s;
    }),
    
    // Moving details
    moveDate: demoData.moving_date,
    moveTime: '09:00', // Default time if not provided
    startAddress: demoData.from_address,
    endAddress: demoData.to_address,
    
    // Floor info
    startFloor: String(demoData.floors),
    endFloor: String(demoData.target_floors),
    startElevator: 'true', // Assuming elevator available
    endElevator: 'true',
    
    // Parking
    startParkingDistance: String(demoData.parking_distance_from),
    endParkingDistance: String(demoData.parking_distance_to),
    
    // Property details (estimated based on volume)
    startLivingArea: String(Math.round(demoData.volume * 3)), // Rough estimate
    endLivingArea: String(Math.round(demoData.volume * 3)),
    
    // Additional info
    estimatedVolume: demoData.volume,
    movingBoxes: demoData.boxes,
    specialInstructions: demoData.special_requirements,
    
    // Required fields with defaults
    paymentMethod: 'invoice',
    additionalServices: ['packingMaterial'], // Since they need boxes
    
    // Optional fields
    needsMovingBoxes: true,
    materials: {
      boxes: demoData.boxes,
      tape: demoData.tape,
      plasticBags: demoData.plastic_bags
    }
  };
}

// Test the conversion
async function testBookingWithDemoData() {
  console.log('🔧 Testing booking API with demo data...\n');
  
  const apiData = convertToAPIFormat(DEMO_DATA);
  
  console.log('📋 Original demo data fields:', Object.keys(DEMO_DATA).join(', '));
  console.log('\n📋 Converted API fields:', Object.keys(apiData).join(', '));
  console.log('\n📤 Sending to API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/submit-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData)
    });
    
    console.log('\n📥 Response status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('❌ Error response:', text);
      return;
    }
    
    const result = await response.json();
    console.log('\n✅ SUCCESS! Booking created:');
    console.log('- Booking ID:', result.bookingId);
    console.log('- Customer ID:', result.customerId);
    console.log('- Reference:', result.bookingReference);
    console.log('- Total Price:', result.totalPrice, 'SEK');
    console.log('- Database saved:', result.database ? 'Yes' : 'No');
    
    // Return the formatted data for use in demo
    return {
      success: true,
      apiFormat: apiData,
      result: result
    };
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to use in your demo script
function formatDemoBookingData(demoData) {
  return convertToAPIFormat(demoData);
}

// Run the test
testBookingWithDemoData().then(result => {
  if (result && result.success) {
    console.log('\n📋 Use this format in your demo:');
    console.log(JSON.stringify(result.apiFormat, null, 2));
  }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatDemoBookingData, convertToAPIFormat };
}