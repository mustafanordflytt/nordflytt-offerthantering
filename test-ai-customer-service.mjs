import fetch from 'node-fetch'

console.log('🤖 Testar AI Kundtjänst-modulen...\n')

async function testAICustomerService() {
  try {
    // 1. Testa health endpoint
    console.log('1️⃣ Testar health endpoint...')
    const healthResponse = await fetch('http://localhost:3002/api/ai-customer-service/health')
    const healthData = await healthResponse.json()
    console.log('✅ Health status:', healthData.production_api_status)
    console.log('   Production URL:', healthData.production_api_url)
    console.log('   Server status:', healthData.server_info?.status)
    
    // 2. Testa sessions endpoint
    console.log('\n2️⃣ Testar sessions endpoint...')
    const sessionsResponse = await fetch('http://localhost:3002/api/ai-customer-service/gpt/sessions')
    console.log('   Status:', sessionsResponse.status, sessionsResponse.statusText)
    
    // 3. Testa tickets endpoint
    console.log('\n3️⃣ Testar tickets endpoint...')
    const ticketsResponse = await fetch('http://localhost:3002/api/ai-customer-service/gpt/tickets')
    console.log('   Status:', ticketsResponse.status, ticketsResponse.statusText)
    
    // 4. Testa analytics endpoint
    console.log('\n4️⃣ Testar analytics endpoint...')
    const analyticsResponse = await fetch('http://localhost:3002/api/ai-customer-service/analytics')
    console.log('   Status:', analyticsResponse.status, analyticsResponse.statusText)
    
    console.log('\n✅ Alla endpoints svarar!')
    console.log('\n📌 Nästa steg:')
    console.log('1. Fixa OpenAI API-kvot')
    console.log('2. Öppna http://localhost:3002/crm/ai-kundtjanst')
    console.log('3. Klicka "Visa Chat Demo" för att testa Maja')
    
  } catch (error) {
    console.error('❌ Fel:', error.message)
  }
}

testAICustomerService()