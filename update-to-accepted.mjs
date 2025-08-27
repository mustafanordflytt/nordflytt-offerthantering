import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const bookingId = '3fa6a931-964e-431b-b3d1-61a6d09c7cb7'

async function updateToAccepted() {
  try {
    // Uppdatera bokningen till accepted status
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'accepted' // Ändra från confirmed till accepted
      })
      .eq('id', bookingId)
      .select()
      .single()
      
    if (error) {
      console.error('Fel vid uppdatering:', error)
      return
    }
    
    console.log('✅ Bokningen uppdaterad!')
    console.log('   ID:', booking.id)
    console.log('   Ny status:', booking.status)
    console.log('')
    console.log('📄 Nu kan du se bekräftelsesidan:')
    console.log(`   http://localhost:3000/order-confirmation/${bookingId}`)
    console.log('')
    console.log('🔐 Eller med token:')
    console.log(`   http://localhost:3000/order-confirmation/${bookingId}?token=1234567890123456`)
    
  } catch (error) {
    console.error('Fel:', error)
  }
}

updateToAccepted()