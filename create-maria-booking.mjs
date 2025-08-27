async function createMariaBooking() {
  console.log('📝 Creating Maria Johansson test booking...\n');
  
  try {
    // Submit booking data through the API
    const bookingData = {
      name: "Maria Johansson",
      email: "maria.johansson@email.com",
      phone: "070-123 45 67",
      customerType: "private",
      serviceType: "moving",
      serviceTypes: ["moving", "packing"],
      moveDate: "2025-02-15",
      moveTime: "09:00",
      startAddress: "Kungsgatan 10, Stockholm",
      endAddress: "Drottninggatan 25, Stockholm",
      startFloor: "3",
      endFloor: "2",
      startElevator: "big",
      endElevator: "small",
      startParkingDistance: "5",
      endParkingDistance: "10",
      startLivingArea: "75",
      endLivingArea: "75",
      startPropertyType: "apartment",
      endPropertyType: "apartment",
      startDoorCode: "1234",
      endDoorCode: "5678",
      calculatedDistance: "2.5",
      movingBoxes: 20,
      largeItems: ["Soffa", "Säng", "Matbord"],
      specialItems: ["Piano"],
      packingService: "Packhjälp",
      cleaningService: "Flyttstädning",
      additionalServices: ["Packning", "Städning"],
      specialInstructions: "Försiktigt med pianot",
      paymentMethod: "invoice",
      estimatedVolume: 35,
      needsMovingBoxes: true,
      totalPrice: 15750
    };
    
    console.log('Sending booking request to API...');
    
    const response = await fetch('http://localhost:3000/api/submit-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Booking created successfully!');
      console.log(`   Booking ID: ${result.bookingId}`);
      console.log(`   Reference: ${result.bookingReference}`);
      console.log(`   Total Price: ${result.totalPrice} SEK`);
      console.log(`   Database saved: ${result.database ? 'Yes' : 'No'}`);
      
      if (result.notifications) {
        console.log('\n📧 Notifications:');
        console.log(`   Email sent: ${result.notifications.emailSent ? 'Yes' : 'No'}`);
        console.log(`   SMS sent: ${result.notifications.smsSent ? 'Yes' : 'No'}`);
      }
      
      // Wait a moment for data to propagate
      console.log('\n⏳ Waiting for data to propagate...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if it appears in offers API
      console.log('\n🔍 Checking if booking appears in Offers API...');
      const offersResponse = await fetch('http://localhost:3000/api/offers');
      const offers = await offersResponse.json();
      
      const mariaOffer = offers.find(offer => 
        offer.customer_name === 'Maria Johansson' ||
        offer.quote_number === result.bookingReference
      );
      
      if (mariaOffer) {
        console.log('✅ Found Maria\'s offer in API:');
        console.log(`   Quote: ${mariaOffer.quote_number}`);
        console.log(`   Status: ${mariaOffer.status}`);
      } else {
        console.log('❌ Maria\'s offer not found in API yet');
        console.log('   This might be a timing issue or the offer might be filtered out');
      }
      
    } else {
      console.log('❌ Failed to create booking:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error creating booking:', error);
  }
}

// Run the function
createMariaBooking();