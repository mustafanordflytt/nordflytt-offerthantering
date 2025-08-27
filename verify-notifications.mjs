// VERIFIERING AV NOTIFIKATIONSFLÖDEN
import dotenv from 'dotenv'
import fetch from 'node-fetch'

// Ladda miljövariabler
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.production' })

console.log('🔍 NORDFLYTT - Verifiering av SMS/Email-flöden')
console.log('==============================================\n')

// Test-konfiguration
const TEST_PHONE = process.env.TEST_PHONE || '0701234567'
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@nordflytt.se'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'

// Resultat
const results = []

// 1. Kontrollera miljövariabler
console.log('📋 1. Kontrollerar miljövariabler...\n')

const requiredEnvVars = {
  'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
  'TWILIO_AUTH_TOKEN': process.env.TWILIO_AUTH_TOKEN,
  'TWILIO_PHONE_NUMBER': process.env.TWILIO_PHONE_NUMBER,
  'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY,
  'SENDGRID_FROM_EMAIL': process.env.SENDGRID_FROM_EMAIL
}

const missingVars = []
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (value) {
    console.log(`✅ ${key}: ${key.includes('TOKEN') || key.includes('KEY') ? '***' : value}`)
  } else {
    console.log(`❌ ${key}: SAKNAS`)
    missingVars.push(key)
  }
}

if (missingVars.length > 0) {
  console.log(`\n⚠️  Saknar ${missingVars.length} miljövariabler!`)
  results.push({ test: 'Miljövariabler', status: 'FAILED', error: `Saknar: ${missingVars.join(', ')}` })
} else {
  console.log('\n✅ Alla miljövariabler hittade!')
  results.push({ test: 'Miljövariabler', status: 'PASSED' })
}

// 2. Testa API endpoints
console.log('\n📋 2. Testar API endpoints...\n')

// 2.1 Test OTP endpoint
console.log('Testing /api/auth/send-otp...')
try {
  const response = await fetch(`${BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: TEST_PHONE })
  })
  
  if (response.ok) {
    const data = await response.json()
    console.log('✅ OTP endpoint fungerar')
    results.push({ test: 'OTP SMS Endpoint', status: 'PASSED' })
  } else {
    console.log('❌ OTP endpoint fel:', response.status)
    results.push({ test: 'OTP SMS Endpoint', status: 'FAILED', error: `HTTP ${response.status}` })
  }
} catch (error) {
  console.log('❌ OTP endpoint fel:', error.message)
  results.push({ test: 'OTP SMS Endpoint', status: 'FAILED', error: error.message })
}

// 2.2 Test booking confirmation endpoint
console.log('\nTesting /api/send-booking-confirmation...')
try {
  const response = await fetch(`${BASE_URL}/api/send-booking-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerEmail: TEST_EMAIL,
      customerPhone: TEST_PHONE,
      customerName: 'Test Kund',
      bookingDetails: {
        date: '2024-01-25',
        fromAddress: 'Testgatan 1',
        toAddress: 'Målgatan 2',
        service: 'Flytthjälp'
      }
    })
  })
  
  if (response.ok) {
    const data = await response.json()
    console.log('✅ Bokningsbekräftelse endpoint fungerar')
    results.push({ test: 'Bokningsbekräftelse Endpoint', status: 'PASSED' })
  } else {
    console.log('❌ Bokningsbekräftelse endpoint fel:', response.status)
    results.push({ test: 'Bokningsbekräftelse Endpoint', status: 'FAILED', error: `HTTP ${response.status}` })
  }
} catch (error) {
  console.log('❌ Bokningsbekräftelse endpoint fel:', error.message)
  results.push({ test: 'Bokningsbekräftelse Endpoint', status: 'FAILED', error: error.message })
}

// 3. Kontrollera Twilio
console.log('\n📋 3. Kontrollerar Twilio...\n')

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    const twilioAuth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64')
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}.json`,
      {
        headers: {
          'Authorization': `Basic ${twilioAuth}`
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Twilio anslutning OK')
      console.log(`   Status: ${data.status}`)
      console.log(`   Namn: ${data.friendly_name}`)
      results.push({ test: 'Twilio Connection', status: 'PASSED' })
    } else {
      console.log('❌ Twilio anslutning fel:', response.status)
      results.push({ test: 'Twilio Connection', status: 'FAILED', error: `HTTP ${response.status}` })
    }
  } catch (error) {
    console.log('❌ Twilio fel:', error.message)
    results.push({ test: 'Twilio Connection', status: 'FAILED', error: error.message })
  }
} else {
  console.log('⏭️  Twilio test överhoppad (saknar credentials)')
  results.push({ test: 'Twilio Connection', status: 'SKIPPED' })
}

// 4. Kontrollera SendGrid
console.log('\n📋 4. Kontrollerar SendGrid...\n')

if (process.env.SENDGRID_API_KEY) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ SendGrid anslutning OK')
      console.log(`   Email: ${data.email}`)
      results.push({ test: 'SendGrid Connection', status: 'PASSED' })
    } else {
      console.log('❌ SendGrid anslutning fel:', response.status)
      const error = await response.text()
      console.log('   Error:', error)
      results.push({ test: 'SendGrid Connection', status: 'FAILED', error: `HTTP ${response.status}` })
    }
  } catch (error) {
    console.log('❌ SendGrid fel:', error.message)
    results.push({ test: 'SendGrid Connection', status: 'FAILED', error: error.message })
  }
} else {
  console.log('⏭️  SendGrid test överhoppad (saknar API key)')
  results.push({ test: 'SendGrid Connection', status: 'SKIPPED' })
}

// 5. Sammanfattning
console.log('\n' + '='.repeat(60))
console.log('📊 SAMMANFATTNING')
console.log('='.repeat(60) + '\n')

const passed = results.filter(r => r.status === 'PASSED').length
const failed = results.filter(r => r.status === 'FAILED').length
const skipped = results.filter(r => r.status === 'SKIPPED').length

console.log(`Total: ${results.length} tester`)
console.log(`✅ Godkända: ${passed}`)
console.log(`❌ Misslyckade: ${failed}`)
console.log(`⏭️  Överhoppade: ${skipped}`)

if (failed > 0) {
  console.log('\n❌ MISSLYCKADE TESTER:')
  results.filter(r => r.status === 'FAILED').forEach(r => {
    console.log(`   - ${r.test}: ${r.error}`)
  })
}

// 6. Rekommendationer
console.log('\n📝 REKOMMENDATIONER')
console.log('===================\n')

if (missingVars.length > 0) {
  console.log('1. Lägg till saknade miljövariabler i .env.local eller .env.production')
}

if (!process.env.TEST_PHONE || !process.env.TEST_EMAIL) {
  console.log('2. Lägg till TEST_PHONE och TEST_EMAIL i .env för säkrare testning')
}

if (failed > 0) {
  console.log('3. Kontrollera att Node.js-servern körs (npm run dev)')
  console.log('4. Verifiera API-nycklar hos Twilio och SendGrid')
}

console.log('\n✅ Verifiering slutförd!')

// 7. Notifikationsflöden
console.log('\n📧 NOTIFIKATIONSFLÖDEN')
console.log('=====================\n')

console.log('1. BOKNINGSBEKRÄFTELSE')
console.log('   Trigger: När bokning skapas')
console.log('   SMS: Kort bekräftelse')
console.log('   Email: Detaljerad info')

console.log('\n2. JOBBPÅMINNELSE')
console.log('   Trigger: 24h innan jobb')
console.log('   SMS: Tid och datum')
console.log('   Email: Checklista')

console.log('\n3. TEAM PÅ VÄG')
console.log('   Trigger: När team startar')
console.log('   SMS: ETA 30 min')

console.log('\n4. FAKTURA')
console.log('   Trigger: Efter jobbet')
console.log('   Email: Faktura med betalningsinfo')

console.log('\n5. OTP LOGIN')
console.log('   Trigger: Personal login')
console.log('   SMS: 6-siffrig kod')

process.exit(failed > 0 ? 1 : 0)