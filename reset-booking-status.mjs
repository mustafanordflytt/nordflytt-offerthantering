import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const bookingId = '3fa6a931-964e-431b-b3d1-61a6d09c7cb7'

async function resetBookingStatus() {
  try {
    // Återställ bokningen till pending status
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'pending' // Återställ till pending så offerten kan godkännas
      })
      .eq('id', bookingId)
      .select()
      .single()
      
    if (error) {
      console.error('Fel vid återställning:', error)
      return
    }
    
    console.log('✅ Bokningen återställd!')
    console.log('   ID:', booking.id)
    console.log('   Status:', booking.status)
    console.log('')
    console.log('📄 Nu kan du se offerten:')
    console.log(`   http://localhost:3000/offer/${bookingId}`)
    console.log('')
    console.log('💡 Klicka på "Acceptera offert" för att godkänna och sedan se bekräftelsesidan.')
    
  } catch (error) {
    console.error('Fel:', error)
  }
}

resetBookingStatus()