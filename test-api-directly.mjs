import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

console.log('🧪 Testar API direkt...\n')

async function testAPI() {
  try {
    // Använd ett existerande jobb-ID
    const jobId = 'd25cb716-46eb-46d5-8cc0-38690ccbe77a'
    
    const testData = {
      jobId: jobId,
      staffName: 'Test Personal',
      staffId: 'test-123',
      services: [
        {
          id: 'tunga-lyft-piano',
          name: 'Tunga lyft - Piano',
          category: 'tunga-lyft',
          price: 1000,
          quantity: 1,
          rutEligible: true
        },
        {
          id: 'flyttkartonger',
          name: 'Flyttkartonger',
          category: 'material',
          price: 79,
          quantity: 5,
          unit: 'st',
          rutEligible: false
        }
      ]
    }
    
    console.log('Skickar request till API...')
    
    const response = await fetch('http://localhost:3000/api/staff/add-service-to-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ API svarade med framgång!')
      console.log('Resultat:', JSON.stringify(result, null, 2))
    } else {
      console.error('❌ API returnerade fel:')
      console.error('Status:', response.status)
      console.error('Error:', result)
    }
    
  } catch (error) {
    console.error('❌ Fel vid API-anrop:', error)
  }
}

// Kontrollera om Next.js server körs
fetch('http://localhost:3000/api/health')
  .then(() => {
    console.log('✅ Next.js server körs på port 3000\n')
    testAPI()
  })
  .catch(() => {
    console.error('❌ Next.js server verkar inte köra på port 3000')
    console.log('Starta servern med: npm run dev')
  })