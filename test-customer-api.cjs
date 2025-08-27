const fetch = require('node-fetch');

async function testCustomerAPI() {
  console.log('🔍 Testing Customer Detail API...\n');
  
  const customerId = '6e0e6ba7-8784-4bf1-948f-012f86c3b1bf';
  
  try {
    // 1. Test customer detail endpoint
    console.log('1. Testing /api/crm/customers/[id]...');
    const customerResponse = await fetch(`http://localhost:3000/api/crm/customers/${customerId}`, {
      headers: {
        'Authorization': 'Bearer mustafa-admin-token'
      }
    });
    
    console.log('Status:', customerResponse.status);
    const customerData = await customerResponse.json();
    console.log('Response:', JSON.stringify(customerData, null, 2));
    
    // 2. Test bookings endpoint
    console.log('\n2. Testing /api/crm/customers/[id]/bookings...');
    const bookingsResponse = await fetch(`http://localhost:3000/api/crm/customers/${customerId}/bookings`, {
      headers: {
        'Authorization': 'Bearer mustafa-admin-token'
      }
    });
    
    console.log('Status:', bookingsResponse.status);
    const bookingsData = await bookingsResponse.json();
    console.log('Response:', JSON.stringify(bookingsData, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCustomerAPI();