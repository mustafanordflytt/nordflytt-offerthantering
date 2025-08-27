import dotenv from 'dotenv'
import { OpenAI } from 'openai'

// Läs miljövariabler
dotenv.config({ path: '.env.development.local' })

console.log('🤖 Testar OpenAI API-integration...\n')

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY saknas i .env.development.local!')
  process.exit(1)
}

console.log('✅ OpenAI API-nyckel hittad')
console.log(`📍 Nyckel börjar med: ${apiKey.substring(0, 10)}...`)

try {
  const openai = new OpenAI({
    apiKey: apiKey
  })

  console.log('\n🧪 Testar API-anslutning...')
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'Du är Maja, en vänlig kundtjänstmedarbetare på Nordflytt.'
      },
      {
        role: 'user',
        content: 'Hej! Jag behöver hjälp med en offert för kontorsflytt.'
      }
    ],
    max_tokens: 150,
    temperature: 0.7
  })

  console.log('\n✅ API-anslutning fungerar!')
  console.log('\n🤖 Majas svar:')
  console.log(response.choices[0].message.content)
  
  console.log('\n📊 Token-användning:')
  console.log(`- Prompt tokens: ${response.usage?.prompt_tokens}`)
  console.log(`- Completion tokens: ${response.usage?.completion_tokens}`)
  console.log(`- Total tokens: ${response.usage?.total_tokens}`)
  
  console.log('\n🎉 OpenAI-integration är redo för produktion!')
  
} catch (error) {
  console.error('\n❌ Fel vid API-anrop:', error.message)
  
  if (error.code === 'invalid_api_key') {
    console.error('⚠️  API-nyckeln är ogiltig')
  } else if (error.code === 'insufficient_quota') {
    console.error('⚠️  API-kvoten är slut')
  } else {
    console.error('⚠️  Kontrollera din internetanslutning och API-nyckel')
  }
  
  process.exit(1)
}