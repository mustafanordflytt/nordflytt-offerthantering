const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 800 });

    console.log('1. Navigating to CRM login page...');
    await page.goto('http://localhost:3001/crm/login', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('2. Handling cookie consent...');
    // Try to click "Accept all" button
    try {
      const acceptButton = await page.$('button[class*="primary"]');
      if (acceptButton) {
        await acceptButton.click();
        console.log('✅ Clicked cookie consent');
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      console.log('⚠️ Cookie consent not found');
    }
    
    console.log('3. Waiting for login form...');
    await page.waitForSelector('form', { timeout: 5000 });
    
    console.log('4. Clearing and filling form with correct credentials...');
    
    // Clear email field first
    const emailInput = await page.$('input[type="email"]');
    await emailInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    
    // Type correct email
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    
    // Clear password field
    const passwordInput = await page.$('input[type="password"]');
    await passwordInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    
    // Type correct password
    await page.type('input[type="password"]', 'admin123');
    
    await page.screenshot({ path: 'crm-login-correct-credentials.png' });
    
    console.log('5. Clicking login button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(e => e),
      page.click('button[type="submit"]')
    ]);
    
    // Wait a moment for redirect
    await new Promise(r => setTimeout(r, 2000));
    
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    if (finalUrl.includes('/crm/dashboard')) {
      console.log('✅ Login successful! Redirected to CRM dashboard');
      
      // Take screenshot of dashboard
      await page.screenshot({ path: 'crm-dashboard-after-login.png' });
      
      // Check for user info
      const userInfo = await page.$eval('body', el => {
        const userElement = el.querySelector('[class*="text-sm"][class*="text-gray-900"]');
        return userElement ? userElement.textContent : null;
      }).catch(() => null);
      
      if (userInfo) {
        console.log('Logged in as:', userInfo);
      }
    } else if (finalUrl.includes('/crm/login')) {
      console.log('❌ Login failed - still on login page');
      
      // Check for error
      const errorText = await page.$eval('[role="alert"]', el => el.textContent).catch(() => null);
      if (errorText) {
        console.log('Error:', errorText);
      }
    } else {
      console.log('⚠️ Unexpected redirect to:', finalUrl);
    }
    
    // Check cookies
    const cookies = await page.cookies();
    const authCookies = cookies.filter(c => 
      c.name === 'auth-token' || 
      c.name === 'crm-user' || 
      c.name === 'session-id'
    );
    console.log('\nAuth cookies found:', authCookies.map(c => c.name));

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'crm-login-error-final.png' });
  } finally {
    await new Promise(r => setTimeout(r, 5000)); // Wait to see result
    await browser.close();
  }
})();