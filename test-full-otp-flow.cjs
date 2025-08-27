const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--window-size=400,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 }); // iPhone 14 Pro
  
  console.log('📱 Testing complete OTP login flow...\n');
  
  try {
    // 1. Go directly to staff login page
    console.log('1. Navigating to staff login page...');
    await page.goto('http://localhost:3000/staff/login', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    // 2. Enter phone number
    console.log('2. Entering phone number...');
    await page.waitForSelector('#phone', { timeout: 5000 });
    await page.type('#phone', '0701234567');
    await page.screenshot({ path: 'otp-flow-1-phone-entered.png' });
    console.log('   ✅ Phone number entered\n');
    
    // 3. Click send OTP button
    console.log('3. Sending OTP...');
    await page.click('button[type="button"]:not([disabled])');
    
    // 4. Wait for OTP field
    await page.waitForSelector('#otp', { timeout: 10000 });
    await page.screenshot({ path: 'otp-flow-2-otp-screen.png' });
    console.log('   ✅ OTP sent and on verification screen\n');
    
    // 5. Get OTP from API (in real app, check SMS)
    console.log('4. Getting OTP code...');
    const response = await fetch('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+46701234567' })
    });
    const data = await response.json();
    const otpCode = data.otp;
    console.log('   📱 OTP Code:', otpCode);
    
    // 6. Enter OTP
    console.log('\n5. Entering OTP code...');
    await page.type('#otp', otpCode);
    await page.screenshot({ path: 'otp-flow-3-otp-entered.png' });
    
    // 7. Click login button
    await page.click('button:has-text("Logga in")');
    console.log('   ✅ OTP submitted\n');
    
    // 8. Wait for redirect to dashboard
    console.log('6. Waiting for dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalUrl = page.url();
    if (finalUrl.includes('/staff/dashboard')) {
      console.log('   ✅ Successfully logged in and redirected to dashboard!');
      await page.screenshot({ path: 'otp-flow-4-dashboard.png' });
      
      // Check for user name in dashboard
      const userName = await page.$eval('.font-medium', el => el.textContent);
      console.log('   👤 Logged in as:', userName);
    } else {
      console.log('   ❌ Not redirected to dashboard. URL:', finalUrl);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'otp-flow-error.png' });
  }
  
  console.log('\n✨ Test complete! Check screenshots.');
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();