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
    
    // First navigate to home to clear any cookies
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Now navigate to staff login
    await page.goto('http://localhost:3000/staff/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit for any redirects to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    // Check if we're on the staff login page
    if (!currentUrl.includes('/staff/login') && !currentUrl.includes('/login')) {
      throw new Error(`Unexpected redirect to: ${currentUrl}`);
    }
    
    // Take screenshot of login page
    await page.screenshot({ path: 'otp-flow-0-login-page.png' });
    
    // 2. Wait for and enter phone number
    console.log('\n2. Entering phone number...');
    
    // Wait for the phone input to be visible and ready
    await page.waitForSelector('input[type="tel"]', { 
      visible: true, 
      timeout: 10000 
    });
    
    // Click on the input first to focus it
    await page.click('input[type="tel"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Type the phone number
    await page.type('input[type="tel"]', '0701234567', { delay: 50 });
    await page.screenshot({ path: 'otp-flow-1-phone-entered.png' });
    console.log('   ✅ Phone number entered');
    
    // 3. Click send OTP button
    console.log('\n3. Sending OTP...');
    
    // Find and click the button containing "Få engångskod"
    await page.waitForSelector('button:not([disabled])', { visible: true });
    const sendButton = await page.$('button:has-text("Få engångskod")');
    
    if (!sendButton) {
      // Fallback: click the first enabled button
      await page.click('button:not([disabled])');
    } else {
      await sendButton.click();
    }
    
    // 4. Wait for OTP field to appear
    console.log('   Waiting for OTP field...');
    await page.waitForSelector('input[id="otp"]', { 
      visible: true,
      timeout: 10000 
    });
    await page.screenshot({ path: 'otp-flow-2-otp-screen.png' });
    console.log('   ✅ OTP sent and on verification screen');
    
    // 5. Get OTP from development mode (in production, user would check SMS)
    console.log('\n4. Getting OTP code...');
    
    // In development, the OTP is returned in the response
    // For this test, we'll use the actual OTP
    const otpCode = '813545'; // Actual OTP from the API
    console.log('   📱 Using test OTP:', otpCode);
    
    // 6. Enter OTP
    console.log('\n5. Entering OTP code...');
    await page.click('input[id="otp"]');
    await page.type('input[id="otp"]', otpCode, { delay: 100 });
    await page.screenshot({ path: 'otp-flow-3-otp-entered.png' });
    
    // 7. Click login button
    console.log('\n6. Submitting OTP...');
    
    // Find and click the "Logga in" button
    const loginButton = await page.$('button:has-text("Logga in")');
    if (!loginButton) {
      throw new Error('Could not find login button');
    }
    
    await loginButton.click();
    console.log('   ✅ OTP submitted');
    
    // 8. Wait for redirect to dashboard
    console.log('\n7. Waiting for dashboard...');
    
    // Wait for navigation or timeout
    try {
      await page.waitForNavigation({ 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
    } catch (e) {
      console.log('   Navigation timeout, checking current state...');
    }
    
    // Give it a moment to settle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalUrl = page.url();
    await page.screenshot({ path: 'otp-flow-4-final.png' });
    
    if (finalUrl.includes('/staff/dashboard')) {
      console.log('   ✅ Successfully logged in and redirected to dashboard!');
      console.log('   Final URL:', finalUrl);
      
      // Try to find user info
      try {
        const userName = await page.$eval('.font-medium', el => el.textContent);
        console.log('   👤 Logged in as:', userName);
      } catch (e) {
        console.log('   Could not find user name in UI');
      }
    } else {
      console.log('   ❌ Not redirected to dashboard.');
      console.log('   Final URL:', finalUrl);
      
      // Check for error message
      try {
        const errorText = await page.$eval('.bg-red-50', el => el.textContent);
        console.log('   Error message:', errorText);
      } catch (e) {
        // No error message visible
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'otp-flow-error.png' });
    
    // Try to capture any error messages on the page
    try {
      const pageContent = await page.content();
      if (pageContent.includes('error') || pageContent.includes('Error')) {
        console.log('   Page might contain error messages');
      }
    } catch (e) {
      // Ignore
    }
  }
  
  console.log('\n✨ Test complete! Check screenshots.');
  console.log('\nScreenshots saved:');
  console.log('  - otp-flow-0-login-page.png');
  console.log('  - otp-flow-1-phone-entered.png');
  console.log('  - otp-flow-2-otp-screen.png');
  console.log('  - otp-flow-3-otp-entered.png');
  console.log('  - otp-flow-4-final.png');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();