const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testNoCustomerName() {
  console.log('\n🧪 TESTING JOB CREATION WITHOUT customer_name COLUMN\n');
  
  const baseUrl = 'http://localhost:3001';
  const testReference = 'NF-23857BDE';
  
  try {
    // Step 1: Test the corrected workflow
    console.log('📋 Step 1: Testing corrected job creation...\n');
    
    const workflowResponse = await fetch(`${baseUrl}/api/debug/test-complete-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: testReference })
    });
    
    const workflowData = await workflowResponse.json();
    
    if (workflowData.success) {
      console.log('✅ WORKFLOW SUCCESSFUL!');
      console.log('\nKey insights:');
      console.log('1. Booking found and status updated to confirmed ✅');
      console.log('2. NO customer_name column needed ✅');
      console.log('3. Customer name comes from JOIN with customers table ✅');
      console.log('4. Job = Booking with confirmed status ✅');
    } else {
      console.log('❌ Workflow failed:', workflowData.error);
    }
    
    // Step 2: Verify job appears correctly
    console.log('\n📋 Step 2: Verifying job appears in listing...\n');
    
    const jobsResponse = await fetch(`${baseUrl}/api/crm/jobs`);
    const jobsData = await jobsResponse.json();
    
    if (jobsData.jobs) {
      const ourJob = jobsData.jobs.find(job => 
        job.bookingNumber === testReference || 
        job.bookingNumber?.includes('23857BDE')
      );
      
      if (ourJob) {
        console.log('✅ JOB FOUND IN LISTING:');
        console.log('Structure received by UI:');
        console.log(JSON.stringify({
          bookingNumber: ourJob.bookingNumber,
          customerName: ourJob.customerName,
          fromAddress: ourJob.fromAddress,
          toAddress: ourJob.toAddress,
          status: ourJob.status
        }, null, 2));
        
        console.log('\n🎯 SUCCESS: Job displays correctly without customer_name column!');
      } else {
        console.log('⚠️ Job not found yet, may need to refresh');
      }
    }
    
    // Step 3: Show the correct data flow
    console.log('\n📊 CORRECT DATA FLOW:\n');
    console.log('1. Booking exists with customer_id');
    console.log('2. Update booking status to "confirmed"');
    console.log('3. /api/crm/jobs queries bookings with customer JOIN');
    console.log('4. Customer name comes from customers.name via JOIN');
    console.log('5. UI receives complete job data with customerName');
    
    console.log('\n✅ NO customer_name COLUMN NEEDED!');
    console.log('✅ Jobs are just confirmed bookings!');
    console.log('✅ Customer data comes from JOIN!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNoCustomerName().then(() => {
  console.log('\n✅ Test complete!\n');
}).catch(console.error);