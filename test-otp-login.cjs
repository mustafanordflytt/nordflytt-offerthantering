const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 }); // iPhone 14 Pro
  
  console.log('📱 Testing OTP login flow...');
  
  try {
    // Go to staff login
    await page.goto('http://localhost:3000/staff/login', { waitUntil: 'networkidle2' });
    console.log('✅ Login page loaded');
    
    // Enter phone number
    await page.waitForSelector('#phone');
    await page.type('#phone', '0701234567');
    console.log('✅ Phone number entered');
    
    // Take screenshot
    await page.screenshot({ path: 'otp-login-1-phone.png' });
    
    // Click send OTP
    const button = await page.$('button[type="button"]');
    await button.click();
    console.log('⏳ Sending OTP...');
    
    // Wait for OTP input
    await page.waitForSelector('#otp', { timeout: 10000 });
    console.log('✅ OTP page loaded');
    
    // Take screenshot
    await page.screenshot({ path: 'otp-login-2-otp.png' });
    
    // In development, the OTP is logged. In real app, check SMS
    console.log('⚠️  Check console/logs for OTP code (development mode)');
    console.log('💡 Enter OTP manually in the browser');
    
    // Wait for manual OTP entry
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds to enter OTP
    
    // Check if redirected to dashboard
    const url = page.url();
    if (url.includes('/staff/dashboard')) {
      console.log('✅ Login successful! Redirected to dashboard');
      await page.screenshot({ path: 'otp-login-3-dashboard.png' });
    } else {
      console.log('❌ Not redirected to dashboard. Current URL:', url);
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    await page.screenshot({ path: 'otp-login-error.png' });
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();