#!/usr/bin/env node

// DIREKT SMS-TEST MED TWILIO
const dotenv = require('dotenv')
const fetch = require('node-fetch')

// Ladda miljövariabler
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.production' })

console.log('🧪 NORDFLYTT DIRECT SMS TEST')
console.log('============================\n')

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER
const TEST_PHONE = process.env.TEST_PHONE || '+46701234567'

async function testTwilioConnection() {
  console.log('1. Testing Twilio connection...')
  
  if (!TWILIO_SID || !TWILIO_TOKEN) {
    console.log('   ❌ Missing Twilio credentials')
    return false
  }
  
  try {
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}.json`,
      {
        headers: { 'Authorization': `Basic ${auth}` }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Connected to Twilio')
      console.log('   Account:', data.friendly_name)
      console.log('   Status:', data.status)
      console.log('   Balance:', data.balance, data.currency)
      return true
    } else {
      console.log('   ❌ Failed:', response.status, response.statusText)
      const error = await response.text()
      console.log('   Error:', error)
      return false
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
    return false
  }
}

async function sendTestSMS() {
  console.log('\n2. Sending test SMS...')
  console.log('   From:', TWILIO_PHONE)
  console.log('   To:', TEST_PHONE)
  
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_PHONE) {
    console.log('   ❌ Missing required credentials')
    return
  }
  
  try {
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE,
          To: TEST_PHONE,
          Body: 'Test från Nordflytt SMS-system 🚚\n\nDenna SMS skickades: ' + new Date().toLocaleString('sv-SE')
        })
      }
    )
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('   ✅ SMS sent successfully!')
      console.log('   SID:', data.sid)
      console.log('   Status:', data.status)
      console.log('   Price:', data.price, data.price_unit)
    } else {
      console.log('   ❌ Failed to send SMS:', data.code, data.message)
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
  }
}

async function testSendGridConnection() {
  console.log('\n3. Testing SendGrid connection...')
  
  const SENDGRID_KEY = process.env.SENDGRID_API_KEY
  if (!SENDGRID_KEY) {
    console.log('   ❌ Missing SendGrid API key')
    return
  }
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Connected to SendGrid')
      console.log('   Username:', data.username)
      console.log('   Email:', data.email || 'Not set')
    } else {
      console.log('   ❌ Failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
  }
}

async function sendTestEmail() {
  console.log('\n4. Sending test email...')
  
  const SENDGRID_KEY = process.env.SENDGRID_API_KEY
  const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'hej@nordflytt.se'
  const TEST_EMAIL = process.env.TEST_EMAIL || 'test@nordflytt.se'
  
  if (!SENDGRID_KEY) {
    console.log('   ❌ Missing SendGrid API key')
    return
  }
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: TEST_EMAIL }]
        }],
        from: { email: FROM_EMAIL, name: 'Nordflytt' },
        subject: 'Test från Nordflytt Email-system',
        content: [{
          type: 'text/html',
          value: `
            <h2>Test Email från Nordflytt</h2>
            <p>Detta är ett test-email skickat ${new Date().toLocaleString('sv-SE')}</p>
            <p>✅ SendGrid fungerar korrekt!</p>
            <hr>
            <p><em>Nordflytt AB</em></p>
          `
        }]
      })
    })
    
    if (response.ok || response.status === 202) {
      console.log('   ✅ Email sent successfully!')
      console.log('   Status:', response.status)
      const messageId = response.headers.get('x-message-id')
      if (messageId) {
        console.log('   Message ID:', messageId)
      }
    } else {
      console.log('   ❌ Failed to send email:', response.status)
      const error = await response.text()
      console.log('   Error:', error)
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
  }
}

async function main() {
  // Test Twilio
  await testTwilioConnection()
  
  // Skicka SMS om flagga satt
  if (process.env.SEND_REAL_SMS === 'true') {
    await sendTestSMS()
  } else {
    console.log('\n⏭️  Skipping SMS send (set SEND_REAL_SMS=true to send)')
  }
  
  // Test SendGrid  
  await testSendGridConnection()
  
  // Skicka email om flagga satt
  if (process.env.SEND_REAL_EMAIL === 'true') {
    await sendTestEmail()
  } else {
    console.log('\n⏭️  Skipping email send (set SEND_REAL_EMAIL=true to send)')
  }
  
  // Sammanfattning
  console.log('\n' + '='.repeat(60))
  console.log('📊 SAMMANFATTNING')
  console.log('='.repeat(60))
  console.log('\n✅ Test slutförd!')
  console.log('\n📝 För att skicka riktiga meddelanden:')
  console.log('   SEND_REAL_SMS=true SEND_REAL_EMAIL=true node test-sms-direct.cjs')
}

main().catch(console.error)