import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Ladda miljövariabler
dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Verifierar Supabase-tabeller...\n')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Saknar Supabase miljövariabler!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyTables() {
  try {
    // Testa att hämta från employees-tabellen
    console.log('1. Testar employees-tabellen...')
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(1)
    
    if (empError) {
      console.error('❌ Fel vid hämtning från employees:', empError.message)
      console.log('\n⚠️  Tabellen verkar inte finnas! Kör migreringen först.')
      console.log('   Gå till Supabase SQL Editor och kör:')
      console.log('   supabase/migrations/20240108_employees_module_fixed.sql')
    } else {
      console.log('✅ employees-tabellen finns!')
      console.log(`   Antal anställda: ${employees?.length || 0}`)
    }
    
    // Testa andra tabeller
    const tables = [
      'employee_skills',
      'employee_contracts', 
      'employee_assets',
      'employee_onboarding',
      'employee_vehicle_access',
      'employee_time_reports'
    ]
    
    console.log('\n2. Testar övriga tabeller...')
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table} - saknas`)
      } else {
        console.log(`✅ ${table} - finns`)
      }
    }
    
    console.log('\n📊 Sammanfattning:')
    console.log('Om någon tabell saknas, kör migreringen i Supabase SQL Editor.')
    
  } catch (error) {
    console.error('\n❌ Oväntat fel:', error.message)
  }
}

verifyTables()