async function updateAnnaJob() {
  console.log('🔄 Updating Anna Svensson job to today...\n');
  
  try {
    // First, get all jobs to find Anna's
    const jobsResponse = await fetch('http://localhost:3000/api/staff/jobs');
    const jobsData = await jobsResponse.json();
    
    console.log(`Found ${jobsData.jobs?.length || 0} total jobs`);
    
    const annaJob = jobsData.jobs?.find(j => 
      j.customerName?.includes('Anna Svensson') || 
      j.bookingNumber === 'JOB52688169'
    );
    
    if (annaJob) {
      console.log('✅ Found Anna Svensson job:', {
        bookingNumber: annaJob.bookingNumber,
        customer: annaJob.customerName,
        status: annaJob.status
      });
    } else {
      console.log('❌ Anna Svensson job not found');
    }
    
    // Create a new test booking for today
    console.log('\n📝 Creating new test booking for today...');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const testBooking = {
      name: "Anna Svensson",
      email: "anna.svensson@test.se",
      phone: "+46701234567",
      moveDate: today.toISOString().split('T')[0],
      moveTime: "09:00",
      fromAddress: "Hornsgatan 45, 118 49 Stockholm",
      toAddress: "Vasagatan 28, 111 20 Stockholm",
      fromFloor: 3,
      toFloor: 2,
      hasElevatorFrom: true,
      hasElevatorTo: false,
      apartmentSize: "3",
      services: ["moving", "packing", "cleaning"],
      additionalServices: ["Packning", "Flyttstädning"],
      specialInstructions: "Ring på dörren märkt 'Svensson'. Ömtåliga tavlor behöver extra försiktighet.",
      estimatedVolume: 25,
      numberOfRooms: 3,
      storageNeeded: false
    };
    
    const response = await fetch('http://localhost:3000/api/submit-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBooking)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ New booking created successfully!');
      console.log('Booking ID:', result.bookingId);
      console.log('Booking Number:', result.bookingNumber);
      
      // Wait a moment for the job to be created
      await new Promise(r => setTimeout(r, 2000));
      
      // Check if job appears in staff dashboard
      const jobsCheck = await fetch('http://localhost:3000/api/staff/jobs');
      const jobsCheckData = await jobsCheck.json();
      const newJob = jobsCheckData.jobs?.find(j => 
        j.customerName?.includes('Anna Svensson') && 
        j.fromAddress?.includes('Hornsgatan')
      );
      
      if (newJob) {
        console.log('\n✅ Job now available in staff dashboard!');
        console.log('Job details:', {
          bookingNumber: newJob.bookingNumber,
          time: `${newJob.moveTime} - ${newJob.endTime}`,
          services: newJob.services.join(', ')
        });
      }
    } else {
      console.error('❌ Failed to create booking:', result.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateAnnaJob();