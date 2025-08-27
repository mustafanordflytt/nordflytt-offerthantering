const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCustomerData() {
  console.log('🔧 Fixing customer data...\n');

  try {
    // 1. First, let's check what's in the customers table
    console.log('1. Checking current customer data...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return;
    }

    console.log('Sample customers:', JSON.stringify(customers, null, 2));

    // 2. Check if we have bookings with customer data
    console.log('\n2. Checking bookings for customer data...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .not('customer_name', 'is', null)
      .limit(5);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return;
    }

    console.log('Sample bookings with customer data:', JSON.stringify(bookings?.map(b => ({
      id: b.id,
      customer_id: b.customer_id,
      customer_name: b.customer_name,
      customer_email: b.customer_email,
      customer_phone: b.customer_phone
    })), null, 2));

    // 3. Update customers with data from bookings
    console.log('\n3. Updating customers with data from bookings...');
    
    // Get all customers with missing data
    const { data: emptyCustomers, error: emptyError } = await supabase
      .from('customers')
      .select('*')
      .or('customer_name.is.null,customer_email.is.null,customer_phone.is.null');

    if (emptyError) {
      console.error('Error fetching empty customers:', emptyError);
      return;
    }

    console.log(`Found ${emptyCustomers.length} customers with missing data`);

    let updatedCount = 0;
    for (const customer of emptyCustomers) {
      // Find a booking for this customer
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('customer_name, customer_email, customer_phone')
        .eq('customer_id', customer.id)
        .not('customer_name', 'is', null)
        .limit(1)
        .single();

      if (!bookingError && booking) {
        // Update the customer
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            customer_name: booking.customer_name,
            customer_email: booking.customer_email,
            customer_phone: booking.customer_phone
          })
          .eq('id', customer.id);

        if (!updateError) {
          updatedCount++;
          console.log(`✓ Updated customer ${customer.id} with name: ${booking.customer_name}`);
        } else {
          console.error(`✗ Failed to update customer ${customer.id}:`, updateError);
        }
      }
    }

    console.log(`\n✅ Updated ${updatedCount} customers`);

    // 4. Verify the fix
    console.log('\n4. Verifying the fix...');
    const { data: fixedCustomers, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .not('customer_name', 'is', null);

    console.log(`Customers with names: ${count}`);
    
    const { count: totalCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact' });
      
    console.log(`Total customers: ${totalCount}`);
    console.log(`Customers still missing data: ${totalCount - count}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

fixCustomerData();