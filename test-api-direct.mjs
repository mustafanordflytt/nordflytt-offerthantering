// Test the leads API directly to see the error

async function testLeadsAPI() {
  console.log('🧪 Testing Leads API directly...\n');
  
  try {
    // First, simulate login to get token
    const mockToken = 'test-token-admin';
    
    // Test the API
    const response = await fetch('http://localhost:3000/api/crm/leads', {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    console.log('\nResponse body:');
    console.log(text);
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('\nNot valid JSON');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLeadsAPI().catch(console.error);