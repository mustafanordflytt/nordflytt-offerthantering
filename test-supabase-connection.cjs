const { createClient } = require('@supabase/supabase-js');

// Read environment variables
const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjM2ODYsImV4cCI6MjA1OTg5OTY4Nn0.uHo-Hhm9Rm3PMkpCH2t6PUV_dlRnf1ufVSXcWVc1tKg';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Test with anon key first
  console.log('1. Testing with anon key...');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Try to fetch customers table
    const { data, error, count } = await supabaseAnon
      .from('customers')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.log('❌ Anon key error:', error.message);
    } else {
      console.log('✅ Anon key success!');
      console.log(`   Found ${count || 0} customers`);
      if (data && data.length > 0) {
        console.log('   Sample customer:', data[0]);
      }
    }
  } catch (err) {
    console.log('❌ Anon key exception:', err.message);
  }

  console.log('\n2. Testing with service key...');
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Try to fetch customers table
    const { data, error, count } = await supabaseService
      .from('customers')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.log('❌ Service key error:', error.message);
    } else {
      console.log('✅ Service key success!');
      console.log(`   Found ${count || 0} customers`);
      if (data && data.length > 0) {
        console.log('   Sample customer:', data[0]);
      }
    }
  } catch (err) {
    console.log('❌ Service key exception:', err.message);
  }

  console.log('\n3. Checking tables...');
  try {
    // List all tables we need
    const tables = ['customers', 'leads', 'jobs', 'quotes', 'employees'];
    
    for (const table of tables) {
      const { error, count } = await supabaseService
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': ${count || 0} rows`);
      }
    }
  } catch (err) {
    console.log('❌ Table check exception:', err.message);
  }

  console.log('\n4. Testing API endpoint directly...');
  try {
    const response = await fetch('http://localhost:3000/api/customers', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`API Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Data:', data);
    } else {
      const text = await response.text();
      console.log('API Error:', text);
    }
  } catch (err) {
    console.log('❌ API call failed:', err.message);
  }
}

testSupabaseConnection().catch(console.error);