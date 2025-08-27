const { createClient } = require('@supabase/supabase-js')

// Läs miljövariabler
require('dotenv').config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase miljövariabler saknas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupCalendarData() {
  console.log('🚀 Sätter upp kalenderdata...\n')

  try {
    // 1. Kontrollera om tabellen har data
    const { count: existingCount } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Befintliga events: ${existingCount || 0}`)

    // 2. Kontrollera RLS
    const { data: tables } = await supabase
      .rpc('get_table_info', { table_name: 'calendar_events' })
      .single()

    if (tables?.rowsecurity) {
      console.log('🔒 RLS är aktiverat')
      
      // Skapa läs-policy om den inte finns
      const policyName = 'Enable read for all users'
      try {
        await supabase.rpc('create_policy_if_not_exists', {
          table_name: 'calendar_events',
          policy_name: policyName,
          policy_definition: 'FOR SELECT USING (true)'
        })
        console.log('✅ Läs-policy skapad/verifierad')
      } catch (err) {
        // Policy finns förmodligen redan
        console.log('ℹ️  Läs-policy finns redan')
      }
    }

    // 3. Lägg till demo-events om tabellen är tom
    if (!existingCount || existingCount === 0) {
      console.log('\n📝 Lägger till demo-events...')

      const demoEvents = [
        {
          event_id: 'EVENT000001',
          title: 'Flytt - Anna Andersson',
          description: 'Lägenhetsflytt från Östermalm till Vasastan',
          event_type: 'job',
          event_status: 'scheduled',
          start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Imorgon
          end_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // +4h
          location_name: 'Östermalm → Vasastan',
          location_address: 'Karlavägen 45, Stockholm',
          priority: 'high',
          assigned_staff: []
        },
        {
          event_id: 'EVENT000002',
          title: 'Kontorsflytt - Tech Startup AB',
          description: 'Kontorsflytt med packhjälp',
          event_type: 'job',
          event_status: 'scheduled',
          start_datetime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Om 3 dagar
          end_datetime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(), // +8h
          location_name: 'Kungsholmen',
          location_address: 'Fleminggatan 20, Stockholm',
          priority: 'high',
          assigned_staff: []
        },
        {
          event_id: 'EVENT000003',
          title: 'Personalmöte - Veckogenomgång',
          description: 'Genomgång av veckans uppdrag',
          event_type: 'meeting',
          event_status: 'scheduled',
          start_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Om en vecka
          end_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2h
          location_name: 'Nordflytt Kontor',
          location_address: 'Huvudkontoret',
          priority: 'medium'
        },
        {
          event_id: 'EVENT000004',
          title: 'Magasinsflytt - Lager & Logistik',
          description: 'Flytt av lagervaror till nytt magasin',
          event_type: 'job',
          event_status: 'scheduled',
          start_datetime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Om 5 dagar
          end_datetime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(), // +6h
          location_name: 'Industriområdet',
          location_address: 'Grossistvägen 10, Järfälla',
          priority: 'high',
          assigned_staff: []
        },
        {
          event_id: 'EVENT000005',
          title: 'Utbildning - Lyftteknik & Säkerhet',
          description: 'Obligatorisk säkerhetsutbildning för all personal',
          event_type: 'training',
          event_status: 'scheduled',
          start_datetime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // Om 10 dagar
          end_datetime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // +3h
          location_name: 'Utbildningscenter',
          location_address: 'Nordflytt Huvudkontor',
          priority: 'high'
        }
      ]

      for (const event of demoEvents) {
        const { error } = await supabase
          .from('calendar_events')
          .insert(event)

        if (error) {
          console.log(`⚠️  Kunde inte lägga till ${event.title}: ${error.message}`)
        } else {
          console.log(`✅ La till: ${event.title}`)
        }
      }
    }

    // 4. Verifiera att events finns nu
    const { count: finalCount } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })

    console.log(`\n✨ Klart! Totalt ${finalCount} events i kalendern`)
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