import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addTestPhotos() {
  const jobId = '1642d15c-f7c6-4bd9-8722-66144bc8f488' // Det jobb vi skapade tidigare
  
  console.log('📸 Adding test photos to job:', jobId)
  
  // Simulera bilder från flyttpersonal
  const movingPhotos = [
    {
      job_id: jobId,
      photo_type: 'before',
      caption: 'Vardagsrum före flytt',
      location_in_property: 'Vardagsrum',
      file_attachment_id: null, // Vi simulerar bara för nu
      is_primary: true,
      sort_order: 1,
      uploaded_by: 'test-user',
      taken_at: new Date('2025-01-30T08:30:00').toISOString()
    },
    {
      job_id: jobId,
      photo_type: 'during',
      caption: 'Packning av köksutrustning',
      location_in_property: 'Kök',
      file_attachment_id: null,
      is_primary: false,
      sort_order: 2,
      uploaded_by: 'test-user',
      taken_at: new Date('2025-01-30T09:15:00').toISOString()
    },
    {
      job_id: jobId,
      photo_type: 'after',
      caption: 'Lägenhet tömd och klar',
      location_in_property: 'Hela lägenheten',
      file_attachment_id: null,
      is_primary: false,
      sort_order: 3,
      uploaded_by: 'test-user',
      taken_at: new Date('2025-01-30T11:30:00').toISOString()
    }
  ]
  
  // Simulera bilder från städpersonal
  const cleaningPhotos = [
    {
      job_id: jobId,
      photo_type: 'cleaning_before',
      caption: 'Kök före städning',
      location_in_property: 'Kök',
      file_attachment_id: null,
      is_primary: false,
      sort_order: 4,
      uploaded_by: 'cleaning-staff',
      taken_at: new Date('2025-01-30T12:00:00').toISOString()
    },
    {
      job_id: jobId,
      photo_type: 'cleaning_after',
      caption: 'Kök efter slutstädning',
      location_in_property: 'Kök',
      file_attachment_id: null,
      is_primary: false,
      sort_order: 5,
      uploaded_by: 'cleaning-staff',
      taken_at: new Date('2025-01-30T14:30:00').toISOString()
    }
  ]
  
  // Först, skapa mock file attachments
  const mockFileAttachments = []
  const allPhotos = [...movingPhotos, ...cleaningPhotos]
  
  for (const photo of allPhotos) {
    const { data: attachment, error } = await supabase
      .from('file_attachments')
      .insert({
        file_name: `${photo.caption.replace(/\s+/g, '-').toLowerCase()}.jpg`,
        file_size: 1024 * 1024 * 2, // 2MB
        mime_type: 'image/jpeg',
        storage_path: `/test-photos/${jobId}/${Date.now()}.jpg`,
        bucket_name: 'job-photos',
        public_url: `https://via.placeholder.com/800x600?text=${encodeURIComponent(photo.caption)}`,
        entity_type: 'job',
        entity_id: jobId,
        description: photo.caption,
        uploaded_by: photo.uploaded_by
      })
      .select()
      .single()
    
    if (!error && attachment) {
      mockFileAttachments.push({
        ...photo,
        file_attachment_id: attachment.id
      })
    } else {
      console.error('❌ Error creating file attachment:', error)
    }
  }
  
  // Nu, lägg till job photos med file attachment IDs
  if (mockFileAttachments.length > 0) {
    const { data: photos, error } = await supabase
      .from('job_photos')
      .insert(mockFileAttachments)
      .select()
    
    if (error) {
      console.error('❌ Error adding photos:', error)
    } else {
      console.log('✅ Added', photos.length, 'test photos')
      console.log('\n📸 Photos added:')
      photos.forEach(photo => {
        console.log(`- ${photo.photo_type}: ${photo.caption}`)
      })
    }
  }
  
  console.log('\n🎉 Test photos added successfully!')
  console.log('Nu kan du öppna "Dokumentation" i bekräftelsesidan för att se bilderna.')
}

addTestPhotos()