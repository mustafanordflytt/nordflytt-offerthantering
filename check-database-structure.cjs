const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...\n');

  try {
    // 1. Check customers table structure
    console.log('1. Customers table columns:');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (!customersError && customersData.length > 0) {
      console.log('Columns:', Object.keys(customersData[0]));
      console.log('\nSample customer:', JSON.stringify(customersData[0], null, 2));
    }

    // 2. Check bookings table structure
    console.log('\n2. Bookings table columns:');
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);

    if (!bookingsError && bookingsData.length > 0) {
      console.log('Columns:', Object.keys(bookingsData[0]));
      console.log('\nSample booking (customer fields only):');
      const customerFields = {};
      Object.keys(bookingsData[0]).forEach(key => {
        if (key.includes('customer') || key === 'name' || key === 'email' || key === 'phone') {
          customerFields[key] = bookingsData[0][key];
        }
      });
      console.log(JSON.stringify(customerFields, null, 2));
    }

    // 3. Check if customers have the right field names
    console.log('\n3. Checking customer field mapping in API...');
    
    // Test the API transformation
    const testCustomer = customersData[0];
    console.log('\nDatabase fields:');
    console.log('- name:', testCustomer.name);
    console.log('- email:', testCustomer.email);
    console.log('- phone:', testCustomer.phone);
    console.log('- customer_name:', testCustomer.customer_name);
    console.log('- customer_email:', testCustomer.customer_email);
    console.log('- customer_phone:', testCustomer.customer_phone);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabaseStructure();