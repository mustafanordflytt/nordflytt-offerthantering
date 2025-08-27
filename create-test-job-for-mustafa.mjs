import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🛠️  Skapar testjobb för Mustafa...\n')

async function createTestJob() {
  try {
    // Skapa ett testjobb med Mustafas customer_id
    const testJob = {
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639', // Från din databas
      title: 'Testflytt - Specialemballering',
      status: 'pending',
      original_price: 5000,
      scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Imorgon
    }
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(testJob)
      .select()
      .single()
    
    if (jobError) {
      console.error('❌ Kunde inte skapa jobb:', jobError)
      return
    }
    
    console.log('✅ Testjobb skapat!')
    console.log('   Job ID:', job.id)
    console.log('   Titel:', job.title)
    console.log('   Original pris:', job.original_price, 'kr')
    console.log('   Status:', job.status)
    console.log('')
    console.log('📝 Använd detta Job ID i Staff App:')
    console.log(`   ${job.id}`)
    console.log('')
    console.log('💡 Tips: Du kan också lägga till detta jobb i din mock-data')
    console.log('   genom att uppdatera localStorage i webbläsaren.')
    
    // Visa hur man kan uppdatera mock-data
    console.log('\n📋 Kopiera och kör detta i webbläsarens konsoll:')
    console.log(`
const mockJobs = JSON.parse(localStorage.getItem('mockJobs') || '[]');
mockJobs.push({
  id: '${job.id}',
  bookingNumber: 'DB-${Date.now()}',
  customerName: 'Mustafa Test',
  customerPhone: '070-123 45 67',
  fromAddress: 'Testgatan 1, Stockholm',
  toAddress: 'Målgatan 2, Stockholm',
  moveTime: '${new Date(job.scheduled_date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}',
  endTime: '${new Date(new Date(job.scheduled_date).getTime() + 4 * 60 * 60 * 1000).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}',
  status: 'upcoming',
  estimatedHours: 4,
  teamMembers: ['Mustafa', 'Kollega'],
  priority: 'medium',
  distance: 15,
  serviceType: 'moving',
  services: ['Flytt', 'Packning'],
  specialRequirements: ['Specialemballering krävs'],
  locationInfo: {
    doorCode: '1234',
    floor: 3,
    elevator: true,
    elevatorStatus: 'Fungerar',
    parkingDistance: 10,
    accessNotes: 'Ring på dörren'
  },
  customerNotes: 'Test för tilläggstjänster',
  equipment: ['Flyttlådor', 'Skyddsmaterial'],
  volume: 20,
  boxCount: 30
});
localStorage.setItem('mockJobs', JSON.stringify(mockJobs));
location.reload();
    `)
    
  } catch (error) {
    console.error('❌ Fel:', error)
  }
}

createTestJob()