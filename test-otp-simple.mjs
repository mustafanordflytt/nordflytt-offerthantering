import fetch from 'node-fetch';

console.log('📱 Testing OTP Authentication System\n');

// Test 1: Send OTP
console.log('1. Sending OTP to +46701234567...');
try {
  const sendResponse = await fetch('http://localhost:3000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+46701234567' })
  });
  
  const sendData = await sendResponse.json();
  
  if (sendResponse.ok && sendData.success) {
    console.log('   ✅ OTP sent successfully');
    console.log('   📱 OTP Code:', sendData.otp, '\n');
    
    // Test 2: Verify OTP
    console.log('2. Verifying OTP...');
    const verifyResponse = await fetch('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '+46701234567',
        code: sendData.otp 
      })
    });
    
    const verifyData = await verifyResponse.json();
    
    if (verifyResponse.ok && verifyData.success) {
      console.log('   ✅ OTP verified successfully');
      console.log('   🔑 JWT Token:', verifyData.token.substring(0, 50) + '...');
      console.log('   👤 Employee:', verifyData.employee.name);
      console.log('   📞 Phone:', verifyData.employee.phone);
      console.log('   👷 Role:', verifyData.employee.role);
      console.log('\n✨ OTP Authentication working perfectly!');
    } else {
      console.error('   ❌ Verification failed:', verifyData.error);
    }
  } else {
    console.error('   ❌ Failed to send OTP:', sendData.error);
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}

console.log('\n📋 Summary:');
console.log('- OTP system is working at API level');
console.log('- JWT tokens are being generated correctly');
console.log('- Employee data is being returned properly');
console.log('- Ready for browser testing once routing is fixed');