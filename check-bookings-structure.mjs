import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStructure() {
  // Hämta en bokning för att se strukturen
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Fel:', error)
  } else if (bookings && bookings.length > 0) {
    console.log('Bookings tabell kolumner:')
    console.log(Object.keys(bookings[0]))
    console.log('\nExempel bokning:')
    console.log(JSON.stringify(bookings[0], null, 2))
  } else {
    console.log('Inga bokningar hittades')
  }
}

checkStructure()