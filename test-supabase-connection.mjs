import fetch from 'node-fetch';

console.log('🔌 Testing Supabase Connection\n');

// Test database connection
async function testDatabaseConnection() {
  console.log('1. Testing database connection via API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/test-simple');
    const data = await response.json();
    
    console.log('\nConnection test result:');
    console.log('   Status:', response.status);
    console.log('   Response:', data);
    
    if (data.database) {
      console.log('\n   Database info:');
      console.log('   - Connected:', data.database.connected);
      console.log('   - Has tables:', data.database.tables);
    }
    
    if (data.environment) {
      console.log('\n   Environment:');
      console.log('   - Has Supabase URL:', !!data.environment.supabaseUrl);
      console.log('   - Has Anon Key:', !!data.environment.supabaseAnonKey);
      console.log('   - Has Service Key:', !!data.environment.supabaseServiceKey);
    }
    
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
}

// Check jobs table structure
async function checkJobsTable() {
  console.log('\n2. Checking jobs table structure...');
  
  try {
    const response = await fetch('http://localhost:3000/api/debug/check-jobs-schema', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('   ✅ Jobs table exists');
      console.log('   Columns:', Object.keys(data.schema || {}).length);
      
      const requiredColumns = ['id', 'customer_id', 'status', 'created_at'];
      const missingColumns = requiredColumns.filter(col => !data.schema?.[col]);
      
      if (missingColumns.length > 0) {
        console.log('   ⚠️ Missing columns:', missingColumns);
      } else {
        console.log('   ✅ All required columns present');
      }
    } else {
      console.log('   ❌ Failed to check table:', data.error);
    }
    
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
}

// Test creating a job directly
async function createTestJobDirect() {
  console.log('\n3. Creating test job directly in database...');
  
  try {
    // First check if jobs table exists
    const checkResponse = await fetch('http://localhost:3000/api/debug/check-jobs-schema', {
      method: 'POST'
    });
    
    const checkData = await checkResponse.json();
    if (!checkResponse.ok || !checkData.success) {
      console.log('   ⚠️ Jobs table might not exist. Need to set up database schema.');
      console.log('   Run: node setup-database.js');
      return;
    }
    
    // Try to create a job
    const response = await fetch('http://localhost:3000/api/test-minimal-job', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('   ✅ Job created successfully');
      console.log('   Job ID:', data.jobId);
    } else {
      console.log('   ❌ Failed to create job:', data.error);
      
      // Try simpler endpoint
      console.log('\n   Trying simpler job creation...');
      const simpleResponse = await fetch('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: 'test-customer-123',
          title: 'Test Job for Staff App',
          status: 'pending',
          pickup_address: 'Test Street 1, Stockholm',
          delivery_address: 'Test Avenue 2, Stockholm'
        })
      });
      
      const simpleData = await simpleResponse.json();
      console.log('   Simple creation result:', simpleData);
    }
    
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
}

// Main execution
async function main() {
  await testDatabaseConnection();
  await checkJobsTable();
  await createTestJobDirect();
  
  console.log('\n📋 Summary:');
  console.log('- Check if environment variables are set correctly');
  console.log('- Ensure database schema is properly initialized');
  console.log('- If jobs table is missing, run database setup');
  console.log('- Staff App will use real data once database is connected');
}

main();