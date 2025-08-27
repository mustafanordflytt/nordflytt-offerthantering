const fs = require('fs')
const path = require('path')

// Kontrollera att .env.development.local finns
const envPath = path.join(process.cwd(), '.env.development.local')

if (fs.existsSync(envPath)) {
  console.log('✅ .env.development.local finns')
  
  // Läs innehållet
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  // Kontrollera viktiga variabler
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName} finns`)
    } else {
      console.log(`❌ ${varName} saknas!`)
    }
  })
  
} else {
  console.log('❌ .env.development.local saknas!')
}