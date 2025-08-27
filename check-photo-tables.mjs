import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  console.log('🔍 Checking job_photos table...')
  
  // Kolla job_photos
  const { data: photos, error: photosError } = await supabase
    .from('job_photos')
    .select('*')
    .limit(1)
    
  if (photosError) {
    console.error('❌ job_photos table error:', photosError)
  } else {
    console.log('✅ job_photos table exists')
  }
  
  // Kolla file_attachments
  console.log('\n🔍 Checking file_attachments table...')
  const { data: attachments, error: attachError } = await supabase
    .from('file_attachments')
    .select('*')
    .limit(1)
    
  if (attachError) {
    console.error('❌ file_attachments table error:', attachError)
  } else {
    console.log('✅ file_attachments table exists')
  }
  
  // Skapa enklare test utan file_attachments
  console.log('\n🎯 Creating simple test photos without file attachments...')
  
  const testPhotos = [
    {
      job_id: '1642d15c-f7c6-4bd9-8722-66144bc8f488',
      photo_type: 'before',
      caption: 'Test - Vardagsrum före flytt',
      location_in_property: 'Vardagsrum',
      is_primary: true,
      sort_order: 1,
      uploaded_by: 'test-user',
      taken_at: new Date().toISOString()
    },
    {
      job_id: '1642d15c-f7c6-4bd9-8722-66144bc8f488',
      photo_type: 'after',
      caption: 'Test - Lägenhet tömd',
      location_in_property: 'Hela lägenheten',
      is_primary: false,
      sort_order: 2,
      uploaded_by: 'test-user',
      taken_at: new Date().toISOString()
    }
  ]
  
  const { data: newPhotos, error: insertError } = await supabase
    .from('job_photos')
    .insert(testPhotos)
    .select()
    
  if (insertError) {
    console.error('❌ Error inserting photos:', insertError)
  } else {
    console.log('✅ Inserted', newPhotos?.length, 'test photos')
    console.log('Photos:', newPhotos)
  }
}

checkTables()