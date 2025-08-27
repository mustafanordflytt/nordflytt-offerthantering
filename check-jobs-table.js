import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hqdptkeumsjuthaoszxi.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZHB0a2V1bXNqdXRoYW9zenhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MDQxNDgsImV4cCI6MjA1MDk4MDE0OH0.d_L_3i1SkQJkJCe1WI93q9sRHLSNYkmsVq5AgBG1BMW';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobsTable() {
  console.log("📊 CHECKING JOBS TABLE\n");
  console.log("=".repeat(60));
  
  try {
    // 1. Count all jobs
    const { count: totalJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total jobs in database: ${totalJobs || 0}`);
    
    // 2. Get recent jobs
    const { data: recentJobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error("Error fetching jobs:", error);
      return;
    }
    
    console.log(`\nRecent jobs (last 10):`);
    (recentJobs || []).forEach(job => {
      console.log(`\n- ID: ${job.id}`);
      console.log(`  Customer: ${job.customer_name}`);
      console.log(`  Date: ${job.scheduled_date}`);
      console.log(`  From: ${job.from_address}`);
      console.log(`  To: ${job.to_address}`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Created: ${job.created_at}`);
    });
    
    // 3. Check for Batman jobs specifically
    const { data: batmanJobs } = await supabase
      .from('jobs')
      .select('*')
      .ilike('customer_name', '%batman%');
    
    console.log(`\n\nBatman jobs found: ${(batmanJobs || []).length}`);
    
    // 4. Check jobs created in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentlyCreated } = await supabase
      .from('jobs')
      .select('*')
      .gte('created_at', oneHourAgo);
    
    console.log(`Jobs created in last hour: ${(recentlyCreated || []).length}`);
    
  } catch (error) {
    console.error("Test error:", error);
  }
}

checkJobsTable();