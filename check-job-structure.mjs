import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkJobStructure() {
  // Hämta ett existerande jobb för att se strukturen
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', '870e464d-eff6-4cc4-85a6-6fc866acb5c5')
    .single()
    
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log('📋 Job structure:')
  Object.keys(job).forEach(key => {
    const value = job[key]
    if (value && typeof value === 'object') {
      console.log(`- ${key}:`, JSON.stringify(value, null, 2))
    } else {
      console.log(`- ${key}:`, value)
    }
  })
}

checkJobStructure()