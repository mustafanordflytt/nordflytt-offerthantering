/**
 * 🦇 BATMAN COMPLETE TEST - Wayne Enterprises System Validation
 * Tests all critical system components end-to-end
 */

const BATMAN_DATA = {
  name: 'Bruce Wayne',
  email: 'bruce.wayne@wayneenterprises.com',
  phone: '070-555-0001',
  customerType: 'private',
  serviceType: 'moving',
  serviceTypes: ['moving', 'packing', 'cleaning'],
  moveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  moveTime: '22:00',
  startAddress: 'Wayne Manor, 1007 Mountain Drive, Gotham City',
  endAddress: 'Batcave, Underground Complex, Gotham',
  startLivingArea: '500',
  endLivingArea: '1000',
  startFloor: '2',
  endFloor: '1',
  startElevator: true,
  endElevator: true,
  startParkingDistance: '10',
  endParkingDistance: '50',
  additionalServices: ['packingMaterial', 'furnitureAssembly'],
  specialInstructions: 'Handle with extreme care - sensitive equipment',
  paymentMethod: 'invoice',
  estimatedVolume: 200
};

async function runBatmanCompleteTest() {
  console.log('🦇 BATMAN COMPLETE SYSTEM TEST\n');
  console.log('Testing Wayne Enterprises requirements...\n');
  
  let score = 0;
  const tests = [];
  
  // Test 1: Complete Booking Creation
  console.log('📋 Test 1: Complete Booking Workflow');
  console.log('Creating booking for Bruce Wayne...');
  
  let bookingId, customerId;
  
  try {
    const response = await fetch('http://localhost:3000/api/submit-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(BATMAN_DATA)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      bookingId = result.bookingId;
      customerId = result.customerId;
      console.log('✅ Booking created successfully!');
      console.log(`   Booking ID: ${bookingId}`);
      console.log(`   Customer ID: ${customerId}`);
      console.log(`   Reference: ${result.bookingReference}`);
      console.log(`   Total Price: ${result.totalPrice} SEK`);
      score += 25;
      tests.push({ name: 'Booking Creation', passed: true });
    } else {
      throw new Error(result.error || 'Booking creation failed');
    }
  } catch (error) {
    console.log('❌ Booking creation failed:', error.message);
    tests.push({ name: 'Booking Creation', passed: false, error: error.message });
  }
  
  // Wait for workflow
  console.log('\n⏳ Waiting for workflow automation...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 2: Customer Created
  console.log('\n📋 Test 2: Customer Management');
  try {
    const response = await fetch('http://localhost:3000/api/crm/customers');
    const data = await response.json();
    
    if (data.success && Array.isArray(data.customers)) {
      const bruceWayne = data.customers.find(c => 
        c.id === customerId || 
        (c.name === 'Bruce Wayne' && c.email === BATMAN_DATA.email)
      );
      
      if (bruceWayne) {
        console.log('✅ Customer found in CRM!');
        console.log(`   Name: ${bruceWayne.name}`);
        console.log(`   Email: ${bruceWayne.email}`);
        console.log(`   Total Bookings: ${bruceWayne.bookingCount || 0}`);
        score += 20;
        tests.push({ name: 'Customer Creation', passed: true });
      } else {
        throw new Error('Bruce Wayne not found in customers');
      }
    } else {
      throw new Error('Invalid customers API response');
    }
  } catch (error) {
    console.log('❌ Customer check failed:', error.message);
    tests.push({ name: 'Customer Creation', passed: false, error: error.message });
  }
  
  // Test 3: Booking in System
  console.log('\n📋 Test 3: Booking Management');
  try {
    const response = await fetch('http://localhost:3000/api/crm/bookings');
    const data = await response.json();
    
    if (data.success && Array.isArray(data.bookings)) {
      const batmanBooking = data.bookings.find(b => 
        b.id === bookingId ||
        (b.customer_id === customerId && b.created_at)
      );
      
      if (batmanBooking) {
        console.log('✅ Booking found in CRM!');
        console.log(`   Status: ${batmanBooking.status}`);
        console.log(`   Services: ${batmanBooking.service_types?.join(', ') || 'N/A'}`);
        console.log(`   Move Date: ${batmanBooking.move_date}`);
        score += 15;
        tests.push({ name: 'Booking in CRM', passed: true });
      } else {
        console.log('⚠️  Booking not yet in CRM (may still be processing)');
        tests.push({ name: 'Booking in CRM', passed: false, error: 'Not found' });
      }
    }
  } catch (error) {
    console.log('❌ Booking check failed:', error.message);
    tests.push({ name: 'Booking in CRM', passed: false, error: error.message });
  }
  
  // Test 4: Lead Created
  console.log('\n📋 Test 4: Lead Management');
  try {
    const response = await fetch('http://localhost:3000/api/crm/leads');
    const data = await response.json();
    
    if (data.success && Array.isArray(data.leads)) {
      const batmanLead = data.leads.find(l => 
        l.email === BATMAN_DATA.email ||
        l.name === 'Bruce Wayne'
      );
      
      if (batmanLead) {
        console.log('✅ Lead created and qualified!');
        console.log(`   Status: ${batmanLead.status}`);
        console.log(`   Value: ${batmanLead.estimatedValue} SEK`);
        score += 15;
        tests.push({ name: 'Lead Management', passed: true });
      } else {
        console.log('⚠️  Lead not found (may not be required)');
        tests.push({ name: 'Lead Management', passed: false, error: 'Not found' });
      }
    }
  } catch (error) {
    console.log('❌ Lead check failed:', error.message);
    tests.push({ name: 'Lead Management', passed: false, error: error.message });
  }
  
  // Test 5: Job Created for Staff
  console.log('\n📋 Test 5: Staff Job Assignment');
  try {
    const response = await fetch('http://localhost:3000/api/staff/jobs');
    const data = await response.json();
    
    if (data.success && Array.isArray(data.jobs)) {
      const batmanJob = data.jobs.find(j => 
        j.customerName === 'Bruce Wayne' ||
        j.customerName?.includes('Bruce') ||
        j.fromAddress?.includes('Wayne Manor')
      );
      
      if (batmanJob) {
        console.log('✅ Job created for staff!');
        console.log(`   Job Number: ${batmanJob.bookingNumber}`);
        console.log(`   Customer: ${batmanJob.customerName}`);
        console.log(`   From: ${batmanJob.fromAddress}`);
        console.log(`   To: ${batmanJob.toAddress}`);
        console.log(`   Date/Time: ${batmanJob.moveTime}`);
        console.log(`   Services: ${batmanJob.services.join(', ')}`);
        score += 25;
        tests.push({ name: 'Staff Job Creation', passed: true });
      } else {
        console.log('❌ Job not found in staff app');
        tests.push({ name: 'Staff Job Creation', passed: false, error: 'Not found' });
      }
    }
  } catch (error) {
    console.log('❌ Staff job check failed:', error.message);
    tests.push({ name: 'Staff Job Creation', passed: false, error: error.message });
  }
  
  // Final Report
  console.log('\n' + '='.repeat(60));
  console.log('🦇 BATMAN APPROVAL REPORT');
  console.log('='.repeat(60));
  
  console.log('\nTest Results:');
  tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}${test.error ? ': ' + test.error : ''}`);
  });
  
  console.log('\n🏆 FINAL SCORE:', `${score}/100 (${score}%)`);
  
  if (score >= 85) {
    console.log('\n✅ WAYNE ENTERPRISES APPROVED!');
    console.log('🦇 "Excellent work. The system meets Gotham\'s standards."');
  } else if (score >= 60) {
    console.log('\n⚠️  CONDITIONAL APPROVAL');
    console.log('🦇 "Functional, but improvements needed for Wayne Enterprises."');
  } else {
    console.log('\n❌ NOT APPROVED');
    console.log('🦇 "This system is not ready for Gotham\'s needs."');
  }
  
  // System Status Summary
  console.log('\n📊 System Status:');
  console.log('- Booking API: ' + (tests[0]?.passed ? '✅ Working' : '❌ Failed'));
  console.log('- Customer Management: ' + (tests[1]?.passed ? '✅ Working' : '❌ Failed'));
  console.log('- CRM Integration: ' + (tests[2]?.passed ? '✅ Working' : '⚠️  Partial'));
  console.log('- Workflow Automation: ' + (tests[4]?.passed ? '✅ Complete' : '⚠️  Incomplete'));
  console.log('- Database: ' + (bookingId ? '✅ Connected' : '⚠️  Issues'));
  
  return score;
}

// Run the test
runBatmanCompleteTest().then(score => {
  console.log('\n🦇 Test completed with score:', score);
}).catch(error => {
  console.error('\n❌ Test failed:', error);
});