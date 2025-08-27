import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Läs miljövariabler
dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase miljövariabler saknas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupCalendarData() {
  console.log('🚀 Sätter upp kalenderdata...\n')
  console.log('📍 Supabase URL:', supabaseUrl)

  try {
    // 1. Kontrollera om tabellen har data
    const { count: existingCount, error: countError } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.log('⚠️  Fel vid räkning:', countError.message)
    } else {
      console.log(`📊 Befintliga events: ${existingCount || 0}`)
    }

    // 2. Lägg till demo-events
    if (!existingCount || existingCount === 0) {
      console.log('\n📝 Lägger till demo-events...')

      // Få dagens datum
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const in3Days = new Date(today)
      in3Days.setDate(in3Days.getDate() + 3)
      
      const in5Days = new Date(today)
      in5Days.setDate(in5Days.getDate() + 5)
      
      const in7Days = new Date(today)
      in7Days.setDate(in7Days.getDate() + 7)
      
      const in10Days = new Date(today)
      in10Days.setDate(in10Days.getDate() + 10)

      const demoEvents = [
        {
          title: 'Flytt - Anna Andersson',
          description: 'Lägenhetsflytt från Östermalm till Vasastan',
          event_type: 'job',
          event_status: 'scheduled',
          start_datetime: new Date(tomorrow.setHours(9, 0, 0, 0)).toISOString(),
          end_datetime: new Date(tomorrow.setHours(13, 0, 0, 0)).toISOString(),
          location_name: 'Östermalm → Vasastan',
          location_address: 'Karlavägen 45, Stockholm',
          priority: 'high'
        },
        {
          title: 'Kontorsflytt - Tech Startup AB',
          description: 'Kontorsflytt med packhjälp',
          event_type: 'job',
          event_status: 'scheduled',
          start_datetime: new Date(in3Days.setHours(8, 0, 0, 0)).toISOString(),
          end_datetime: new Date(in3Days.setHours(16, 0, 0, 0)).toISOString(),
          location_name: 'Kungsholmen',
          location_address: 'Fleminggatan 20, Stockholm',
          priority: 'high'
        },
        {
          title: 'Personalmöte - Veckogenomgång',
          description: 'Genomgång av veckans uppdrag',
          event_type: 'meeting',
          event_status: 'scheduled',
          start_datetime: new Date(in7Days.setHours(14, 0, 0, 0)).toISOString(),
          end_datetime: new Date(in7Days.setHours(16, 0, 0, 0)).toISOString(),
          location_name: 'Nordflytt Kontor',
          location_address: 'Huvudkontoret',
          priority: 'medium'
        },
        {
          title: 'Magasinsflytt - Lager & Logistik',
          description: 'Flytt av lagervaror till nytt magasin',
          event_type: 'job',
          event_status: 'scheduled',
          start_datetime: new Date(in5Days.setHours(7, 0, 0, 0)).toISOString(),
          end_datetime: new Date(in5Days.setHours(13, 0, 0, 0)).toISOString(),
          location_name: 'Industriområdet',
          location_address: 'Grossistvägen 10, Järfälla',
          priority: 'high'
        },
        {
          title: 'Utbildning - Lyftteknik & Säkerhet',
          description: 'Obligatorisk säkerhetsutbildning för all personal',
          event_type: 'training',
          event_status: 'scheduled',
          start_datetime: new Date(in10Days.setHours(9, 0, 0, 0)).toISOString(),
          end_datetime: new Date(in10Days.setHours(12, 0, 0, 0)).toISOString(),
          location_name: 'Utbildningscenter',
          location_address: 'Nordflytt Huvudkontor',
          priority: 'high'
        }
      ]

      for (const event of demoEvents) {
        const { data, error } = await supabase
          .from('calendar_events')
          .insert(event)
          .select()

        if (error) {
          console.log(`⚠️  Kunde inte lägga till ${event.title}: ${error.message}`)
        } else {
          console.log(`✅ La till: ${event.title}`)
        }
      }
    } else {
      console.log('ℹ️  Events finns redan, skippar demo-data')
    }

    // 3. Verifiera att events finns nu
    const { count: finalCount } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })

    console.log(`\n✨ Klart! Totalt ${finalCount || 0} events i kalendern`)
    console.log('\n📌 Nästa steg:')
    console.log('1. Gå till http://localhost:3002/crm/kalender')
    console.log('2. Kalendern borde nu visa events!')
    console.log('3. Om inte, tryck F12 och kolla Console/Network för fel')

  } catch (error) {
    console.error('❌ Fel:', error.message)
    console.error('\n💡 Tips:')
    console.error('1. Kontrollera att .env.development.local har rätt variabler')
    console.error('2. Kontrollera att calendar_events tabellen finns i Supabase')
    console.error('3. Kolla att du har rätt behörigheter i Supabase')
  }
}

// Kör setup
setupCalendarData()