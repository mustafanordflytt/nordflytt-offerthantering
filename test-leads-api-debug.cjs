const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugLeadsAPI() {
  console.log('\n🔍 DEBUGGING LEADS API RESPONSE FORMAT\n');
  
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Test 1: Basic API call
    console.log('📋 Test 1: Basic API call to /api/crm/leads\n');
    
    const response = await fetch(`${baseUrl}/api/crm/leads`);
    const responseText = await response.text();
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Raw response (first 500 chars):', responseText.substring(0, 500));
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('\n✅ Response is valid JSON');
    } catch (parseError) {
      console.log('\n❌ Response is NOT valid JSON:', parseError.message);
      return;
    }
    
    // Test 2: Check data structure
    console.log('\n📋 Test 2: Checking data structure\n');
    
    console.log('Type of response:', typeof data);
    console.log('Is array:', Array.isArray(data));
    console.log('Has leads property:', data.hasOwnProperty('leads'));
    console.log('Type of data.leads:', typeof data.leads);
    console.log('Is data.leads array:', Array.isArray(data.leads));
    
    if (data.leads) {
      console.log('Number of leads:', data.leads.length);
    }
    
    // Test 3: Test array methods
    console.log('\n📋 Test 3: Testing array methods\n');
    
    if (data.leads) {
      try {
        // Test .some()
        const hasSome = data.leads.some(l => l.status === 'new');
        console.log('✅ .some() method works:', hasSome);
      } catch (e) {
        console.log('❌ .some() method failed:', e.message);
      }
      
      try {
        // Test .map()
        const names = data.leads.map(l => l.name);
        console.log('✅ .map() method works, found names:', names.slice(0, 3).join(', '));
      } catch (e) {
        console.log('❌ .map() method failed:', e.message);
      }
      
      try {
        // Test .filter()
        const converted = data.leads.filter(l => l.status === 'converted');
        console.log('✅ .filter() method works, converted leads:', converted.length);
      } catch (e) {
        console.log('❌ .filter() method failed:', e.message);
      }
    }
    
    // Test 4: Look for mustafa lead
    console.log('\n📋 Test 4: Looking for mustafa lead\n');
    
    if (data.leads && Array.isArray(data.leads)) {
      const mustajaLead = data.leads.find(l => 
        l.email?.includes('mustafa') || 
        l.name?.toLowerCase().includes('mustafa') ||
        l.metadata?.offer_reference === 'NF-23857BDE'
      );
      
      if (mustajaLead) {
        console.log('✅ Found mustafa lead:');
        console.log('   - Name:', mustajaLead.name);
        console.log('   - Email:', mustajaLead.email);
        console.log('   - Status:', mustajaLead.status);
        console.log('   - Metadata:', JSON.stringify(mustajaLead.metadata));
      } else {
        console.log('❌ No mustafa lead found');
      }
    }
    
    // Test 5: Check if store might be corrupting data
    console.log('\n📋 Test 5: Testing with fetch vs store\n');
    
    // Direct fetch test
    const directTest = await fetch(`${baseUrl}/api/crm/leads`)
      .then(r => r.json())
      .then(d => {
        console.log('Direct fetch - has leads array:', Array.isArray(d.leads));
        return d.leads?.some(l => true) !== undefined;
      })
      .catch(e => {
        console.log('Direct fetch error:', e.message);
        return false;
      });
    
    console.log('Direct fetch .some() works:', directTest);
    
    // Summary
    console.log('\n\n📊 DEBUG SUMMARY:\n');
    
    if (data && data.leads && Array.isArray(data.leads)) {
      console.log('✅ API returns correct format');
      console.log('✅ data.leads is a proper array');
      console.log('✅ Array methods should work');
      console.log('\n⚠️  If .some() still fails in the app, check:');
      console.log('   1. The store might be corrupting the data');
      console.log('   2. There might be a race condition');
      console.log('   3. The error might be from a different API call');
    } else {
      console.log('❌ API format is incorrect');
      console.log('   Actual format:', JSON.stringify(data, null, 2).substring(0, 200));
    }
    
  } catch (error) {
    console.error('\n❌ Debug test failed:', error);
  }
}

// Run the debug test
debugLeadsAPI().then(() => {
  console.log('\n✅ Debug test complete!\n');
}).catch(console.error);