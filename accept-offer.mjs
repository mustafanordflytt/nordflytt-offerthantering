import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const bookingId = '3fa6a931-964e-431b-b3d1-61a6d09c7cb7'

async function acceptOffer() {
  try {
    // Uppdatera bokningen till accepted/completed status
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed', // Använd confirmed status
        payment_method: 'invoice'
      })
      .eq('id', bookingId)
      .select()
      .single()
      
    if (error) {
      console.error('Fel vid accepterande:', error)
      return
    }
    
    console.log('✅ Offert accepterad!')
    console.log('   Status:', booking.status)
    console.log('')
    console.log('📄 Nu kan du se bekräftelsesidan:')
    console.log(`   http://localhost:3000/order-confirmation/${bookingId}`)
    console.log('')
    console.log('💡 Tips: Tryck F5 för att ladda om sidan om den redan är öppen')
    
  } catch (error) {
    console.error('Fel:', error)
  }
}

acceptOffer()