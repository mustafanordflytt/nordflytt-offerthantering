const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kfwprciqswdnkfuaweyi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmd3ByY2lxc3dkbmtmdWF3ZXlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDg3NjA2OSwiZXhwIjoyMDUwNDUyMDY5fQ.xPOEdGGryts2u7gVUhDMA4c-7a8RTCA_pDpp3NzQiJI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkJobsTableStructure() {
  console.log('Checking jobs table structure...\n');
  
  try {
    // Get table info
    const { data: tableInfo, error: tableError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing jobs table:', tableError);
      return;
    }
    
    if (tableInfo && tableInfo.length > 0) {
      console.log('Jobs table columns:');
      console.log(Object.keys(tableInfo[0]));
      console.log('\nSample job data:');
      console.log(JSON.stringify(tableInfo[0], null, 2));
    } else {
      console.log('Jobs table exists but is empty');
    }
    
    // Get all jobs
    const { data: allJobs, error: allError } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!allError && allJobs) {
      console.log(`\nTotal jobs in table: ${allJobs.length}`);
      if (allJobs.length > 0) {
        console.log('\nLast 3 jobs:');
        allJobs.slice(0, 3).forEach((job, index) => {
          console.log(`\n${index + 1}. Job ID: ${job.id}`);
          console.log(`   Customer ID: ${job.customer_id}`);
          console.log(`   Title: ${job.title}`);
          console.log(`   Status: ${job.status}`);
          console.log(`   Created: ${job.created_at}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkJobsTableStructure();