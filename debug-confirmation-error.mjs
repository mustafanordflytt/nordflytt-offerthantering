import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const bookingId = 'b6ed8e08-bd77-499f-a419-c5569cf651ed'

console.log('🔍 DEBUG AV BEKRÄFTELSESIDA')
console.log('===========================\n')

async function debugConfirmationData() {
  try {
    // 1. Hämta booking data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()
      
    if (bookingError) {
      console.error('❌ Kunde inte hämta bokning:', bookingError)
      return
    }
    
    console.log('📋 BOKNINGSDATA:')
    console.log('   ID:', booking.id)
    console.log('   Status:', booking.status)
    console.log('   Move Date:', booking.move_date, typeof booking.move_date)
    console.log('   Move Time:', booking.move_time, typeof booking.move_time)
    console.log('   Customer Email:', booking.customer_email)
    console.log('   Total Price:', booking.total_price)
    
    console.log('\n📅 DATUMFÄLT I DETAILS:')
    if (booking.details) {
      console.log('   moveDate:', booking.details.moveDate, typeof booking.details.moveDate)
      console.log('   moveTime:', booking.details.moveTime, typeof booking.details.moveTime)
      console.log('   scheduledDate:', booking.details.scheduledDate)
      console.log('   scheduledTime:', booking.details.scheduledTime)
    }
    
    // 2. Testa Date-konstruktion
    console.log('\n🧪 TESTAR DATE-KONSTRUKTION:')
    
    try {
      const date1 = new Date(booking.move_date)
      console.log('   new Date(move_date):', date1, date1.toISOString())
    } catch (e) {
      console.log('   ❌ new Date(move_date) failed:', e.message)
    }
    
    try {
      const dateTime = `${booking.move_date}T${booking.move_time}`
      console.log('   DateTime string:', dateTime)
      const date2 = new Date(dateTime)
      console.log('   new Date(datetime):', date2, date2.toISOString())
    } catch (e) {
      console.log('   ❌ new Date(datetime) failed:', e.message)
    }
    
    // 3. Kontrollera alla datum i olika format
    console.log('\n🔍 KONTROLLERAR ALLA MÖJLIGA DATUM:')
    const possibleDates = [
      booking.move_date,
      booking.details?.moveDate,
      booking.details?.scheduledDate,
      booking.created_at,
      booking.details?.createdAt
    ]
    
    possibleDates.forEach((date, index) => {
      if (date) {
        try {
          const d = new Date(date)
          console.log(`   Date ${index}: ${date} -> ${d.toISOString()} (Valid: ${!isNaN(d.getTime())})`)
        } catch (e) {
          console.log(`   Date ${index}: ${date} -> ERROR: ${e.message}`)
        }
      }
    })
    
    // 4. Visa fel rad från stacktrace
    console.log('\n📍 FELET UPPSTÅR PÅ:')
    console.log('   Fil: app/order-confirmation/[id]/page.tsx')
    console.log('   Rad: 2056 (generateCalendarLinks funktion)')
    console.log('   Fel: RangeError - Invalid time value')
    
    console.log('\n💡 LÖSNING:')
    console.log('   Vi har redan avaktiverat kalenderfunktionen,')
    console.log('   men felet kvarstår. Detta tyder på att:')
    console.log('   1. Next.js-servern inte startats om ordentligt')
    console.log('   2. Browser-cache behöver rensas')
    console.log('   3. Det finns en annan plats där Date används')
    
  } catch (error) {
    console.error('❌ Debug fel:', error)
  }
}

debugConfirmationData()