import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking existing database schema...\n');
  
  try {
    // Check customers table
    console.log('📋 Customers table:');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customerError) {
      console.log('❌ Error reading customers:', customerError.message);
    } else if (customers && customers.length > 0) {
      console.log('   Columns:', Object.keys(customers[0]));
      console.log('   Sample record:', customers[0]);
    }
    
    // Check bookings table (alternative name for jobs)
    console.log('\n📋 Bookings table:');
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (bookingError) {
      console.log('❌ Error reading bookings:', bookingError.message);
    } else if (bookings && bookings.length > 0) {
      console.log('   Columns:', Object.keys(bookings[0]));
    }
    
    // Check if jobs table exists
    console.log('\n📋 Jobs table:');
    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);
    
    if (jobError) {
      console.log('❌ Jobs table not found or error:', jobError.message);
    } else {
      console.log('✅ Jobs table exists');
    }
    
    // Check offers table
    console.log('\n📋 Offers table:');
    const { data: offers, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .limit(1);
    
    if (offerError) {
      console.log('❌ Offers table not found or error:', offerError.message);
    } else {
      console.log('✅ Offers table exists');
    }
    
    // List all available tables
    console.log('\n📊 Available tables in database:');
    const tables = ['customers', 'bookings', 'offers', 'leads', 'jobs', 'calendar_events', 'staff_schedules'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`   ✅ ${table}: ${count} records`);
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkDatabaseSchema();