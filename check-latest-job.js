async function checkLatestJob() {
  console.log('Checking latest job and booking...\n');
  
  try {
    // Check jobs table
    const jobsResponse = await fetch('http://localhost:3000/api/test-jobs-schema');
    const jobsResult = await jobsResponse.json();
    console.log('Jobs table:', JSON.stringify(jobsResult, null, 2));
    
    // Check bookings
    const bookingsResponse = await fetch('http://localhost:3000/api/crm/bookings');
    const bookings = await bookingsResponse.json();
    console.log('\nLatest bookings:');
    if (bookings.data && bookings.data.length > 0) {
      bookings.data.slice(0, 3).forEach((booking, index) => {
        console.log(`${index + 1}. Booking ID: ${booking.id}`);
        console.log(`   Customer: ${booking.customer_name}`);
        console.log(`   Created: ${booking.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

checkLatestJob();