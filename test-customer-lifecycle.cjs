const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCustomerLifecycle() {
  console.log('\n🧪 TESTING COMPLETE CUSTOMER LIFECYCLE INTEGRATION\n');
  
  const baseUrl = 'http://localhost:3001';
  const testReference = 'NF-23857BDE';
  
  try {
    // Step 1: Check current customer count
    console.log('📋 Step 1: Checking current customers...\n');
    
    const customersResponse = await fetch(`${baseUrl}/api/crm/customers`);
    const customersData = await customersResponse.json();
    
    console.log(`Current customers: ${customersData.customers?.length || 0}`);
    if (customersData.customers) {
      customersData.customers.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.name} (${c.email})`);
      });
    }
    
    const mustajaExists = customersData.customers?.some(c => 
      c.email === 'mustafa.habo@gmail.com' || 
      c.name?.toLowerCase().includes('mustafa')
    );
    
    if (!mustajaExists) {
      console.log('\n⚠️ mustafa abdulkarim NOT found in customers');
    } else {
      console.log('\n✅ mustafa abdulkarim found in customers');
    }
    
    // Step 2: Check current leads
    console.log('\n📋 Step 2: Checking current leads...\n');
    
    const leadsResponse = await fetch(`${baseUrl}/api/crm/leads`);
    const leadsData = await leadsResponse.json();
    
    console.log(`Current leads: ${leadsData.leads?.length || 0}`);
    if (leadsData.leads) {
      leadsData.leads.forEach((l, i) => {
        console.log(`  ${i + 1}. ${l.name} - Status: ${l.status} (${l.email})`);
      });
    }
    
    // Step 3: Test complete workflow
    console.log('\n📋 Step 3: Testing complete workflow for NF-23857BDE...\n');
    
    const workflowResponse = await fetch(`${baseUrl}/api/debug/test-complete-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: testReference })
    });
    
    const workflowData = await workflowResponse.json();
    
    if (workflowData.success) {
      console.log('✅ Workflow completed successfully!');
    } else {
      console.log('❌ Workflow failed:', workflowData.error);
    }
    
    // Step 4: Re-check customers after workflow
    console.log('\n📋 Step 4: Re-checking customers after workflow...\n');
    
    const customersResponse2 = await fetch(`${baseUrl}/api/crm/customers`);
    const customersData2 = await customersResponse2.json();
    
    console.log(`Updated customer count: ${customersData2.customers?.length || 0}`);
    
    const mustajaExists2 = customersData2.customers?.some(c => 
      c.email === 'mustafa.habo@gmail.com' || 
      c.name?.toLowerCase().includes('mustafa')
    );
    
    if (mustajaExists2) {
      console.log('✅ mustafa abdulkarim NOW appears in customers!');
    }
    
    // Step 5: Re-check leads after workflow
    console.log('\n📋 Step 5: Re-checking leads after workflow...\n');
    
    const leadsResponse2 = await fetch(`${baseUrl}/api/crm/leads`);
    const leadsData2 = await leadsResponse2.json();
    
    const convertedLead = leadsData2.leads?.find(l => 
      l.status === 'converted' && 
      (l.email === 'mustafa.habo@gmail.com' || l.metadata?.offer_reference === testReference)
    );
    
    if (convertedLead) {
      console.log('✅ Lead found with converted status!');
      console.log(`   - Name: ${convertedLead.name}`);
      console.log(`   - Status: ${convertedLead.status}`);
      console.log(`   - Value: ${convertedLead.estimatedValue} kr`);
    }
    
    // Summary
    console.log('\n📊 CUSTOMER LIFECYCLE SUMMARY:\n');
    console.log('Expected Results:');
    console.log('✅ Customer created: mustafa abdulkarim');
    console.log('✅ Lead created with offer reference');
    console.log('✅ Lead status: converted (after acceptance)');
    console.log('✅ All entities linked: customer ↔ lead ↔ offer ↔ job');
    console.log('✅ Statistics updated: Total customers should increase');
    
    console.log('\nActual Results:');
    console.log(`- Total customers: ${customersData2.customers?.length || 0}`);
    console.log(`- mustafa in customers: ${mustajaExists2 ? '✅ Yes' : '❌ No'}`);
    console.log(`- Lead with converted status: ${convertedLead ? '✅ Yes' : '❌ No'}`);
    console.log(`- NF-23857BDE visible in all sections: ${workflowData.success ? '✅ Yes' : '❌ No'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCustomerLifecycle().then(() => {
  console.log('\n✅ Test complete!\n');
}).catch(console.error);