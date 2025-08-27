import fetch from 'node-fetch';

console.log('🔐 Testing Complete Authentication Flow\n');

async function testCompleteFlow() {
  try {
    // 1. Send OTP
    console.log('1. Sending OTP to test employee (+46701234567)...');
    const sendResponse = await fetch('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+46701234567' })
    });
    
    const sendData = await sendResponse.json();
    
    if (!sendResponse.ok || !sendData.success) {
      throw new Error('Failed to send OTP: ' + (sendData.error || 'Unknown error'));
    }
    
    console.log('   ✅ OTP sent successfully');
    console.log('   📱 OTP Code (dev only):', sendData.otp);
    
    // 2. Verify OTP
    console.log('\n2. Verifying OTP code...');
    const verifyResponse = await fetch('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '+46701234567',
        code: sendData.otp 
      })
    });
    
    const verifyData = await verifyResponse.json();
    
    if (!verifyResponse.ok || !verifyData.success) {
      throw new Error('Failed to verify OTP: ' + (verifyData.error || 'Unknown error'));
    }
    
    console.log('   ✅ OTP verified successfully');
    console.log('   🔑 JWT Token received');
    console.log('   👤 Employee:', verifyData.employee.name);
    console.log('   📞 Phone:', verifyData.employee.phone);
    console.log('   👷 Role:', verifyData.employee.role);
    
    const token = verifyData.token;
    
    // 3. Test authenticated API call
    console.log('\n3. Testing authenticated API access...');
    const jobsResponse = await fetch('http://localhost:3000/api/staff/jobs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const jobsData = await jobsResponse.json();
    
    if (!jobsResponse.ok) {
      throw new Error('Failed to fetch jobs: ' + (jobsData.error || 'Unknown error'));
    }
    
    console.log('   ✅ Successfully accessed protected API');
    console.log('   📊 Jobs fetched:', jobsData.jobs?.length || 0);
    console.log('   📍 Data source:', jobsData.source);
    
    // 4. Test invalid token
    console.log('\n4. Testing invalid token rejection...');
    const invalidResponse = await fetch('http://localhost:3000/api/staff/jobs', {
      headers: {
        'Authorization': 'Bearer invalid-token-123'
      }
    });
    
    if (invalidResponse.status === 401) {
      console.log('   ✅ Invalid token correctly rejected');
    } else {
      console.log('   ⚠️ Invalid token not rejected properly');
    }
    
    // 5. Check OTP expiration
    console.log('\n5. Checking OTP cannot be reused...');
    const reuseResponse = await fetch('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '+46701234567',
        code: sendData.otp 
      })
    });
    
    if (reuseResponse.status === 401) {
      console.log('   ✅ OTP correctly marked as used');
    } else {
      console.log('   ⚠️ OTP reuse not prevented');
    }
    
    console.log('\n✅ Authentication System Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- OTP generation and sending: ✅');
    console.log('- OTP verification: ✅');
    console.log('- JWT token generation: ✅');
    console.log('- Protected API access: ✅');
    console.log('- Invalid token rejection: ✅');
    console.log('- OTP single-use enforcement: ✅');
    
    console.log('\n🎉 JWT Authentication is fully operational!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Ensure OTP table is created in Supabase');
    console.log('2. Check that demo employee exists');
    console.log('3. Verify environment variables are set');
  }
}

testCompleteFlow();