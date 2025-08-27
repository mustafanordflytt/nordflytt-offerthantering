import fetch from 'node-fetch'

const BOOKING_ID = 'b87bc970-d99f-45ae-aa8f-1fb8bb44c3e4'

async function testAdditionalServicesAPI() {
  console.log('🔍 Testing additional services API...')
  
  try {
    const url = `http://localhost:3000/api/bookings/${BOOKING_ID}/additional-services`
    console.log('📡 Fetching from:', url)
    
    const response = await fetch(url)
    console.log('📊 Response status:', response.status)
    
    const data = await response.json()
    console.log('📦 Response data:', JSON.stringify(data, null, 2))
    
    if (data.additionalServices && data.additionalServices.length > 0) {
      console.log('\n✅ Additional services found:')
      data.additionalServices.forEach((service) => {
        console.log(`  - ${service.service_name}: ${service.total_price} kr (${service.quantity} ${service.unit})`)
      })
      console.log(`\n💰 Total additional cost: ${data.totalAdditionalCost} kr`)
    } else {
      console.log('❌ No additional services found')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testAdditionalServicesAPI()