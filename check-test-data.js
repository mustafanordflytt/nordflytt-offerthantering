async function checkTestData() {
  console.log('🔍 Checking for test data...\n');
  
  try {
    // Check bookings
    const bookingsResponse = await fetch('http://localhost:3000/api/bookings');
    const bookings = await bookingsResponse.json();
    console.log(`Bookings found: ${bookings.length || 0}`);
    
    if (bookings.length > 0) {
      console.log('\nRecent bookings:');
      bookings.slice(0, 5).forEach(b => {
        console.log(`- ${b.name} (${b.email}) - Move date: ${b.moveDate || 'No date'}`);
      });
    }
    
    // Check jobs
    const jobsResponse = await fetch('http://localhost:3000/api/staff/jobs');
    const jobsData = await jobsResponse.json();
    console.log(`\nJobs found: ${jobsData.jobs?.length || 0}`);
    
    if (jobsData.jobs?.length > 0) {
      console.log('\nRecent jobs:');
      jobsData.jobs.slice(0, 5).forEach(j => {
        console.log(`- ${j.bookingNumber}: ${j.customerName} - ${j.fromAddress}`);
      });
    }
    
    // Check for Anna Svensson specifically
    console.log('\n🔍 Looking for Anna Svensson...');
    const annaBooking = bookings.find(b => 
      b.name?.toLowerCase().includes('anna') || 
      b.email?.toLowerCase().includes('anna')
    );
    
    if (annaBooking) {
      console.log('✅ Found Anna Svensson booking:', annaBooking);
    } else {
      console.log('❌ No Anna Svensson booking found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTestData();