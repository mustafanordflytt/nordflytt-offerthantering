const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting Puppeteer test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  try {
    // 1. Go to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/crm/login', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'login-page.png' });
    
    // 2. Check if form exists
    console.log('\n2. Checking for form elements...');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    console.log('Email input found:', !!emailInput);
    console.log('Password input found:', !!passwordInput);
    console.log('Submit button found:', !!submitButton);
    
    if (!emailInput || !passwordInput) {
      console.log('\n❌ Form inputs not found! Let me check the page content...');
      const pageContent = await page.content();
      console.log('Page content preview:', pageContent.substring(0, 500));
      
      // Try alternative approach - inject login directly
      console.log('\n3. Trying direct localStorage injection...');
      await page.evaluate(() => {
        const user = {
          id: '6a8589db-f55a-4e97-bd46-1dfb8b725909',
          email: 'mustafa@nordflytt.se',
          name: 'Mustafa Abdulkarim',
          role: 'admin',
          permissions: ['*']
        };
        localStorage.setItem('crm-user', JSON.stringify(user));
        localStorage.setItem('crm-token', 'mustafa-admin-token');
      });
      
      console.log('✅ Injected user data into localStorage');
      
      // Navigate to dashboard
      console.log('\n4. Navigating to dashboard...');
      await page.goto('http://localhost:3000/crm/dashboard', { waitUntil: 'networkidle2' });
      await page.screenshot({ path: 'dashboard-after-injection.png' });
      
      const dashboardUrl = page.url();
      console.log('Current URL:', dashboardUrl);
      
      if (dashboardUrl.includes('/dashboard')) {
        console.log('✅ Successfully reached dashboard!');
      } else {
        console.log('❌ Failed to reach dashboard, redirected to:', dashboardUrl);
      }
      
    } else {
      // Normal login flow
      console.log('\n3. Filling form...');
      await emailInput.type('mustafa@nordflytt.se');
      await passwordInput.type('mustafa123');
      await page.screenshot({ path: 'form-filled.png' });
      
      console.log('\n4. Clicking submit button...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        submitButton.click()
      ]);
      
      await page.screenshot({ path: 'after-submit.png' });
      
      const currentUrl = page.url();
      console.log('\n5. Current URL after submit:', currentUrl);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Login successful!');
      } else {
        console.log('❌ Login failed, still on:', currentUrl);
        
        // Check localStorage
        const localStorageData = await page.evaluate(() => {
          return {
            user: localStorage.getItem('crm-user'),
            token: localStorage.getItem('crm-token')
          };
        });
        
        console.log('\nLocalStorage data:', localStorageData);
      }
    }
    
    // Check for errors on the page
    const errorElements = await page.$$('[role="alert"], .error, .text-red-500');
    if (errorElements.length > 0) {
      console.log('\n⚠️ Found error elements on page');
      for (const element of errorElements) {
        const text = await page.evaluate(el => el.textContent, element);
        console.log('Error text:', text);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'error-state.png' });
  }
  
  console.log('\n📸 Screenshots saved!');
  console.log('- login-page.png');
  console.log('- form-filled.png (if form found)');
  console.log('- after-submit.png (if submitted)');
  console.log('- dashboard-after-injection.png (if injection used)');
  console.log('- error-state.png (if error occurred)');
  
  // Keep browser open for manual inspection
  console.log('\n👀 Browser left open for inspection. Press Ctrl+C to close.');
})();