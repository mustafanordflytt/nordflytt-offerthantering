const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCompleteFix() {
  console.log('\n🧪 TESTING COMPLETE CRM INTEGRATION FIX\n');
  
  const baseUrl = 'http://localhost:3001';
  const testReference = 'NF-23857BDE';
  
  try {
    // Test 1: API Response Formats
    console.log('📋 Test 1: API Response Formats\n');
    
    // Test Customers API
    const customersResponse = await fetch(`${baseUrl}/api/crm/customers`);
    const customersData = await customersResponse.json();
    
    if (Array.isArray(customersData.customers)) {
      console.log('✅ Customers API returns array format');
      console.log(`   - Total customers: ${customersData.customers.length}`);
      
      // Test .map() method
      try {
        const names = customersData.customers.map(c => c.name);
        console.log('✅ .map() method works on customers');
      } catch (e) {
        console.log('❌ .map() method failed on customers');
      }
    } else {
      console.log('❌ Customers API does not return array format');
    }
    
    // Test Leads API
    const leadsResponse = await fetch(`${baseUrl}/api/crm/leads`);
    const leadsData = await leadsResponse.json();
    
    if (Array.isArray(leadsData.leads)) {
      console.log('✅ Leads API returns array format');
      console.log(`   - Total leads: ${leadsData.leads.length}`);
      
      // Test .map() method
      try {
        const statuses = leadsData.leads.map(l => l.status);
        console.log('✅ .map() method works on leads');
      } catch (e) {
        console.log('❌ .map() method failed on leads');
      }
    } else {
      console.log('❌ Leads API does not return array format');
    }
    
    // Test 2: Customer Lifecycle
    console.log('\n📋 Test 2: Customer Lifecycle Check\n');
    
    // Check if mustafa exists as customer
    const mustafa = customersData.customers?.find(c => 
      c.email === 'mustafa.habo@gmail.com' || 
      c.name?.toLowerCase().includes('mustafa')
    );
    
    if (mustafa) {
      console.log('✅ mustafa abdulkarim found as customer');
      console.log(`   - Customer ID: ${mustafa.id}`);
      console.log(`   - Name: ${mustafa.name}`);
      console.log(`   - Total Value: ${mustafa.totalValue} kr`);
      console.log(`   - Bookings: ${mustafa.bookingCount}`);
    } else {
      console.log('❌ mustafa abdulkarim NOT found in customers');
    }
    
    // Check if lead exists with converted status
    const convertedLead = leadsData.leads?.find(l => 
      l.status === 'converted' && 
      (l.email === 'mustafa.habo@gmail.com' || l.metadata?.offer_reference === testReference)
    );
    
    if (convertedLead) {
      console.log('✅ Converted lead found');
      console.log(`   - Lead Name: ${convertedLead.name}`);
      console.log(`   - Status: ${convertedLead.status}`);
      console.log(`   - Estimated Value: ${convertedLead.estimatedValue} kr`);
    } else {
      console.log('❌ No converted lead found for mustafa');
    }
    
    // Test 3: Offer Status
    console.log('\n📋 Test 3: Offer Status Check\n');
    
    const offersResponse = await fetch(`${baseUrl}/api/offers`);
    const offersData = await offersResponse.json();
    
    const targetOffer = offersData.offers?.find(o => o.reference === testReference);
    
    if (targetOffer) {
      console.log(`Found offer ${testReference}:`);
      console.log(`   - Status: ${targetOffer.status}`);
      console.log(`   - Offer Status: ${targetOffer.offer_status || 'not set'}`);
      
      if (targetOffer.offer_status === 'accepted' || targetOffer.status === 'Godkänd') {
        console.log('✅ Offer status is Godkänd/accepted');
      } else {
        console.log('❌ Offer status not updated to Godkänd');
      }
    } else {
      console.log('❌ Offer not found');
    }
    
    // Test 4: Time Estimation
    console.log('\n📋 Test 4: Time Estimation Check\n');
    
    const jobsResponse = await fetch(`${baseUrl}/api/crm/jobs`);
    const jobsData = await jobsResponse.json();
    
    const targetJob = jobsData.jobs?.find(j => 
      j.bookingNumber === testReference || 
      j.customerName?.toLowerCase().includes('mustafa')
    );
    
    if (targetJob) {
      console.log(`Found job ${targetJob.bookingNumber}:`);
      console.log(`   - Customer: ${targetJob.customerName}`);
      console.log(`   - Estimated Hours: ${targetJob.estimatedHours}`);
      console.log(`   - Volume: ${targetJob.estimatedVolume || 'unknown'} m³`);
      
      if (targetJob.estimatedHours === 6) {
        console.log('✅ Time estimation is correct (6 hours)');
      } else {
        console.log(`❌ Time estimation incorrect (${targetJob.estimatedHours} hours instead of 6)`);
      }
    } else {
      console.log('❌ Job not found');
    }
    
    // Test 5: Frontend Crash Check
    console.log('\n📋 Test 5: Frontend Crash Prevention\n');
    
    // Check if all customers have required fields
    let hasNullSafetyIssues = false;
    customersData.customers?.forEach(customer => {
      if (customer.totalValue === undefined || customer.totalValue === null) {
        console.log(`⚠️ Customer ${customer.name} has null totalValue`);
        hasNullSafetyIssues = true;
      }
      if (!customer.createdAt) {
        console.log(`⚠️ Customer ${customer.name} has null createdAt`);
        hasNullSafetyIssues = true;
      }
    });
    
    if (!hasNullSafetyIssues) {
      console.log('✅ All customers have required fields (no null safety issues)');
    } else {
      console.log('❌ Some customers have null fields that could cause frontend crashes');
    }
    
    // Summary
    console.log('\n\n📊 COMPLETE FIX SUMMARY:\n');
    
    const allTestsPassed = 
      Array.isArray(customersData.customers) &&
      Array.isArray(leadsData.leads) &&
      mustafa &&
      convertedLead &&
      (targetOffer?.offer_status === 'accepted' || targetOffer?.status === 'Godkänd') &&
      targetJob?.estimatedHours === 6 &&
      !hasNullSafetyIssues;
    
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED! CRM Integration is fully fixed:');
      console.log('   - API response formats are correct');
      console.log('   - Customer lifecycle is complete');
      console.log('   - Offer status updates to Godkänd');
      console.log('   - Time estimation uses existing calculation');
      console.log('   - Frontend crash prevention implemented');
      console.log('\n🎉 mustafa abdulkarim appears as customer #4 with complete data!');
    } else {
      console.log('❌ Some tests failed. Issues remaining:');
      if (!Array.isArray(customersData.customers)) console.log('   - Customers API format');
      if (!Array.isArray(leadsData.leads)) console.log('   - Leads API format');
      if (!mustafa) console.log('   - Customer creation for mustafa');
      if (!convertedLead) console.log('   - Lead conversion');
      if (targetOffer?.offer_status !== 'accepted') console.log('   - Offer status update');
      if (targetJob?.estimatedHours !== 6) console.log('   - Time estimation');
      if (hasNullSafetyIssues) console.log('   - Null safety in frontend');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the complete test
testCompleteFix().then(() => {
  console.log('\n✅ Complete integration test finished!\n');
}).catch(console.error);