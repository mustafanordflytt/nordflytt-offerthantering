import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Checking jobs table structure...\n')

async function checkStructure() {
  // Get one job to see its structure
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error:', error)
  } else if (jobs && jobs.length > 0) {
    console.log('Jobs table columns:')
    console.log(Object.keys(jobs[0]))
    console.log('\nSample job:')
    console.log(JSON.stringify(jobs[0], null, 2))
  } else {
    console.log('No jobs found in database')
  }
}

checkStructure()