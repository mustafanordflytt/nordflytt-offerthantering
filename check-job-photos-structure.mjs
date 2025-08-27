import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkJobPhotosStructure() {
  console.log('🔍 Fetching job_photos records...')
  
  // Hämta alla job_photos för att se strukturen
  const { data: photos, error } = await supabase
    .from('job_photos')
    .select('*')
    .limit(5)
    
  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Found', photos?.length || 0, 'photos')
    if (photos && photos.length > 0) {
      console.log('\n📋 Sample photo structure:')
      console.log(JSON.stringify(photos[0], null, 2))
      
      console.log('\n🔑 Available columns:')
      console.log(Object.keys(photos[0]))
    }
  }
  
  // Försök lägga till en enkel photo med minimal data
  console.log('\n📸 Trying to add a simple photo...')
  
  const simplePhoto = {
    job_id: '1642d15c-f7c6-4bd9-8722-66144bc8f488',
    photo_url: 'https://via.placeholder.com/800x600?text=Test+Photo',
    created_at: new Date().toISOString()
  }
  
  const { data: newPhoto, error: insertError } = await supabase
    .from('job_photos')
    .insert([simplePhoto])
    .select()
    
  if (insertError) {
    console.error('❌ Insert error:', insertError)
  } else {
    console.log('✅ Successfully added photo:', newPhoto)
  }
}

checkJobPhotosStructure()