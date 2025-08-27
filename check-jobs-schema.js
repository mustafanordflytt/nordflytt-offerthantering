const fetch = require('node-fetch');

async function checkJobsSchema() {
  console.log('\n🔍 COMPREHENSIVE JOBS TABLE SCHEMA AUDIT\n');
  
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Step 1: Check jobs schema
    console.log('📋 Step 1: Fetching jobs table schema...\n');
    
    const schemaResponse = await fetch(`${baseUrl}/api/debug/check-jobs-schema`);
    const schemaData = await schemaResponse.json();
    
    if (schemaData.error) {
      console.error('❌ Schema check failed:', schemaData.error);
      return;
    }
    
    console.log('JOBS TABLE STRUCTURE:');
    console.log('====================');
    console.log('Table exists:', schemaData.schema.tableExists);
    console.log('Total rows:', schemaData.schema.rowCount);
    console.log('\nColumns found:');
    
    if (schemaData.schema.columns && schemaData.schema.columns.length > 0) {
      schemaData.schema.columns.forEach(col => {
        console.log(`  - ${col}`);
      });
    } else {
      console.log('  (No columns found or table empty)');
    }
    
    console.log('\nSample row:');
    if (schemaData.schema.sampleRow) {
      Object.entries(schemaData.schema.sampleRow).forEach(([key, value]) => {
        console.log(`  ${key}: ${typeof value} = ${JSON.stringify(value)?.substring(0, 50)}...`);
      });
    }
    
    console.log('\nTest creation result:');
    console.log('Success:', schemaData.testCreation.success);
    if (schemaData.testCreation.error) {
      console.log('Error:', schemaData.testCreation.error);
    }
    
    // Step 2: Get actual jobs data
    console.log('\n📋 Step 2: Fetching actual jobs from API...\n');
    
    const jobsResponse = await fetch(`${baseUrl}/api/crm/jobs`);
    const jobsData = await jobsResponse.json();
    
    if (jobsData.jobs && jobsData.jobs.length > 0) {
      console.log(`Found ${jobsData.jobs.length} jobs in system`);
      console.log('\nFirst job structure:');
      const firstJob = jobsData.jobs[0];
      Object.keys(firstJob).forEach(key => {
        console.log(`  - ${key}: ${typeof firstJob[key]}`);
      });
    }
    
    // Step 3: Compare what we're trying to insert
    console.log('\n📋 Step 3: What our code tries to insert...\n');
    
    const ourJobStructure = {
      customer_id: 'string',
      title: 'string',
      description: 'string ❌ (MISSING?)',
      job_type: 'string',
      status: 'string',
      priority: 'string',
      scheduled_date: 'string',
      scheduled_time: 'string',
      start_address: 'string',
      end_address: 'string',
      estimated_cost: 'number',
      special_requirements: 'string',
      metadata: 'object'
    };
    
    console.log('Our job creation structure:');
    Object.entries(ourJobStructure).forEach(([key, type]) => {
      const exists = schemaData.schema.columns?.includes(key);
      console.log(`  ${key}: ${type} ${exists ? '✅' : '❌'}`);
    });
    
    // Step 4: Find minimal required columns
    console.log('\n📋 Step 4: Identifying minimal required columns...\n');
    
    // Try to create a minimal job
    const minimalJobTest = await fetch(`${baseUrl}/api/debug/test-job-creation`);
    const minimalResult = await minimalJobTest.json();
    
    if (minimalResult.success) {
      console.log('✅ Minimal job creation successful');
    } else {
      console.log('❌ Minimal job creation failed:', minimalResult.error);
    }
    
    // Step 5: Recommendations
    console.log('\n🎯 RECOMMENDATIONS:\n');
    
    const missingColumns = [];
    if (!schemaData.schema.columns?.includes('description')) {
      missingColumns.push('description');
    }
    if (!schemaData.schema.columns?.includes('job_type')) {
      missingColumns.push('job_type');
    }
    if (!schemaData.schema.columns?.includes('priority')) {
      missingColumns.push('priority');
    }
    if (!schemaData.schema.columns?.includes('special_requirements')) {
      missingColumns.push('special_requirements');
    }
    
    if (missingColumns.length > 0) {
      console.log('Missing columns that code expects:');
      missingColumns.forEach(col => console.log(`  - ${col}`));
      
      console.log('\nOption 1: Remove these fields from job creation');
      console.log('Option 2: Add these columns to jobs table in Supabase');
    }
    
    // Generate fixed job structure
    console.log('\n📝 FIXED JOB STRUCTURE (only existing columns):\n');
    
    const fixedJobStructure = {};
    const knownColumns = ['customer_id', 'title', 'status', 'scheduled_date', 'scheduled_time', 
                         'start_address', 'end_address', 'estimated_cost', 'metadata'];
    
    knownColumns.forEach(col => {
      if (schemaData.schema.columns?.includes(col)) {
        fixedJobStructure[col] = ourJobStructure[col] || 'unknown';
      }
    });
    
    console.log('const jobData = {');
    Object.entries(fixedJobStructure).forEach(([key, type]) => {
      console.log(`  ${key}: // ${type}`);
    });
    console.log('};');
    
  } catch (error) {
    console.error('❌ Schema audit failed:', error);
  }
}

// Run the audit
checkJobsSchema().then(() => {
  console.log('\n✅ Schema audit complete!\n');
}).catch(console.error);