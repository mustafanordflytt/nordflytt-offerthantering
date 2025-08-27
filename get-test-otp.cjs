// Simple script to get OTP for testing
const fetch = require('node-fetch');

async function getOTP() {
  try {
    console.log('📱 Requesting OTP for +46701234567...\n');
    
    const response = await fetch('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+46701234567' })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', data);
      if (data.otp) {
        console.log('\n🔑 OTP Code:', data.otp);
        console.log('   (Only available in development mode)');
      }
    } else {
      console.error('❌ Error:', data);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

getOTP();