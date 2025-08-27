const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

console.log('🔍 Testing button sizes in Staff App\n');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--window-size=400,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 }); // iPhone 14 Pro
  
  try {
    // 1. Go to staff login
    console.log('1. Testing Staff Login page buttons...');
    await page.goto('http://localhost:3000/staff/login', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'button-test-1-login.png' });
    
    // Check button sizes
    const loginButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => {
        const rect = btn.getBoundingClientRect();
        const styles = window.getComputedStyle(btn);
        return {
          text: btn.textContent?.trim().substring(0, 20) || 'No text',
          height: rect.height,
          width: rect.width,
          minHeight: styles.minHeight,
          className: btn.className
        };
      });
    });
    
    console.log('\n   Login page buttons:');
    loginButtons.forEach(btn => {
      const status = btn.height >= 44 ? '✅' : '❌';
      console.log(`   ${status} "${btn.text}": ${btn.height}px height`);
    });
    
    // 2. Login to access dashboard
    console.log('\n2. Logging in...');
    
    // Wait for page to be ready
    await page.waitForSelector('input', { visible: true });
    
    // Enter phone number - the input might not have type="tel" attribute
    const phoneInput = await page.$('input[placeholder*="070"]');
    if (phoneInput) {
      await phoneInput.type('0701234567');
    }
    
    // Click the button that contains the text
    await new Promise(resolve => setTimeout(resolve, 500));
    const sendOtpButton = await page.$('button:not([disabled])');
    if (sendOtpButton) {
      await sendOtpButton.click();
    }
    
    // Wait for OTP field
    try {
      await page.waitForSelector('input[placeholder="123456"]', { timeout: 5000 });
    } catch (e) {
      console.log('   Could not find OTP field, checking current state...');
      await page.screenshot({ path: 'button-test-otp-error.png' });
    }
    
    // Get OTP from API
    const otpResponse = await fetch('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+46701234567' })
    });
    const otpData = await otpResponse.json();
    
    // Enter OTP
    await page.type('input[placeholder="123456"]', otpData.otp);
    
    // Click login button
    const loginButton = await page.$('button:not([disabled])');
    if (loginButton) {
      await loginButton.click();
    }
    
    // Wait for dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Test dashboard buttons
    console.log('\n3. Testing Staff Dashboard buttons...');
    await page.screenshot({ path: 'button-test-2-dashboard.png' });
    
    const dashboardButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => {
        const rect = btn.getBoundingClientRect();
        const styles = window.getComputedStyle(btn);
        return {
          text: btn.textContent?.trim().substring(0, 30) || 'No text',
          height: rect.height,
          width: rect.width,
          minHeight: styles.minHeight,
          className: btn.className,
          visible: rect.height > 0 && rect.width > 0
        };
      }).filter(btn => btn.visible); // Only visible buttons
    });
    
    console.log('\n   Dashboard buttons:');
    let smallButtonCount = 0;
    dashboardButtons.forEach(btn => {
      const status = btn.height >= 44 ? '✅' : '❌';
      console.log(`   ${status} "${btn.text}": ${btn.height}px height`);
      if (btn.height < 44) smallButtonCount++;
    });
    
    // 4. Check CSS rules
    console.log('\n4. Checking CSS rules...');
    const cssCheck = await page.evaluate(() => {
      const testButton = document.createElement('button');
      testButton.className = 'touch-manipulation';
      document.body.appendChild(testButton);
      const styles = window.getComputedStyle(testButton);
      const minHeight = styles.minHeight;
      document.body.removeChild(testButton);
      return { minHeight };
    });
    
    console.log(`   Global button min-height: ${cssCheck.minHeight || 'Not set'}`);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total buttons found: ${loginButtons.length + dashboardButtons.length}`);
    console.log(`   Buttons < 44px: ${smallButtonCount}`);
    console.log(`   Compliance: ${smallButtonCount === 0 ? '✅ All buttons meet 44px minimum' : '❌ Some buttons need fixing'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'button-test-error.png' });
  }
  
  console.log('\n✨ Test complete! Check screenshots.');
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();