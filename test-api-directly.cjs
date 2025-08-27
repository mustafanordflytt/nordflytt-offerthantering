const fetch = require('node-fetch');

async function testAPI() {
  console.log('🔍 Testing CRM Customers API directly...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/crm/customers', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mustafa-admin-token'
      }
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    
    if (data.success) {
      console.log('\nAPI returned success!');
      console.log('Total customers:', data.customers?.length || 0);
      console.log('\nFirst 3 customers:');
      
      data.customers?.slice(0, 3).forEach((customer, i) => {
        console.log(`\n${i + 1}. Customer:`);
        console.log('   ID:', customer.id);
        console.log('   Name:', customer.name);
        console.log('   Email:', customer.email);
        console.log('   Phone:', customer.phone);
        console.log('   Type:', customer.customerType);
      });
    } else {
      console.log('API error:', data.error);
    }
    
  } catch (error) {
    console.error('Error calling API:', error.message);
  }
}

testAPI();