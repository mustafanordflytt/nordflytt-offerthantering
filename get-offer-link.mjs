const bookingId = '6cb25b02-22e4-4e19-9ea0-9d67870cc9b2'

console.log('📄 OFFERTLÄNKAR:\n')

console.log('1. Med token (rekommenderad):')
console.log(`   http://localhost:3000/offer/${bookingId}?token=1234567890123456`)

console.log('\n2. Med access key:')
console.log(`   http://localhost:3000/offer/${bookingId}?key=1234567890123456`)

console.log('\n💡 Använd länk #1 för att komma åt offerten direkt.')