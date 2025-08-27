async function checkAPIDirect() {
  console.log('🔍 Checking Staff Jobs API Directly\n');
  
  try {
    // Test 1: Basic API call
    console.log('1️⃣ Testing /api/staff/jobs...');
    const response1 = await fetch('http://localhost:3000/api/staff/jobs');
    const data1 = await response1.json();
    
    console.log('Response status:', response1.status);
    console.log('Success:', data1.success);
    console.log('Jobs count:', data1.jobs?.length || 0);
    
    if (data1.jobs && data1.jobs.length > 0) {
      console.log('\nFirst 3 jobs:');
      data1.jobs.slice(0, 3).forEach((job, i) => {
        console.log(`\n${i + 1}. ${job.bookingNumber} - ${job.customerName}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Time: ${job.moveTime} - ${job.endTime}`);
        console.log(`   From: ${job.fromAddress}`);
      });
    }
    
    // Test 2: With date parameter
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n2️⃣ Testing with today's date (${today})...`);
    const response2 = await fetch(`http://localhost:3000/api/staff/jobs?date=${today}`);
    const data2 = await response2.json();
    
    console.log('Jobs for today:', data2.jobs?.length || 0);
    
    // Test 3: Check job dates
    if (data1.jobs && data1.jobs.length > 0) {
      console.log('\n3️⃣ Checking job dates...');
      const jobDates = data1.jobs.map(job => ({
        booking: job.bookingNumber,
        date: job.moveDate || job.scheduledDate || 'No date'
      }));
      
      console.log('Job dates:');
      jobDates.forEach(job => {
        console.log(`   ${job.booking}: ${job.date}`);
      });
    }
    
    // Test 4: Check if Anna's job exists
    console.log('\n4️⃣ Looking for Anna Svensson job...');
    const annaJob = data1.jobs?.find(job => 
      job.customerName?.includes('Anna Svensson') ||
      job.bookingNumber === 'JOB52688169'
    );
    
    if (annaJob) {
      console.log('✅ Found Anna\'s job:');
      console.log(JSON.stringify(annaJob, null, 2));
    } else {
      console.log('❌ Anna\'s job not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAPIDirect();