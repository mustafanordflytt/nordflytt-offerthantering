const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 800 });

    // Enable console logging
    page.on('console', msg => {
      if (!msg.text().includes('React DevTools') && !msg.text().includes('Web Vitals')) {
        console.log('Browser console:', msg.text());
      }
    });
    page.on('pageerror', error => console.log('Page error:', error.message));

    console.log('1. Navigating to CRM login page...');
    await page.goto('http://localhost:3001/crm/login', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('2. Waiting for page to load...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Take screenshot
    await page.screenshot({ path: 'crm-login-current-state.png' });
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/login') && !currentUrl.includes('/crm/login')) {
      console.log('⚠️ Redirected to general login page instead of CRM login');
    }
    
    // Try to find form
    const formExists = await page.$('form') !== null;
    console.log('Form exists:', formExists);
    
    if (formExists) {
      // Try to fill in the form
      console.log('3. Attempting to fill form...');
      
      // Type email
      await page.type('input[type="email"]', 'admin@nordflytt.se');
      
      // Type password
      await page.type('input[type="password"]', 'admin123');
      
      // Take screenshot after filling
      await page.screenshot({ path: 'crm-login-filled.png' });
      
      // Click submit
      console.log('4. Clicking submit...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('Navigation error:', e.message)),
        page.click('button[type="submit"]')
      ]);
      
      // Check where we ended up
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);
      
      await page.screenshot({ path: 'crm-login-final.png' });
      
      // Check cookies
      const cookies = await page.cookies();
      const authCookies = cookies.filter(c => 
        c.name === 'auth-token' || 
        c.name === 'crm-user' || 
        c.name === 'session-id'
      );
      console.log('Auth cookies:', authCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
    } else {
      console.log('❌ No form found on page');
      
      // Check page content
      const bodyText = await page.$eval('body', el => el.innerText);
      console.log('Page content preview:', bodyText.substring(0, 200));
    }

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'crm-login-error.png' });
  } finally {
    await new Promise(r => setTimeout(r, 3000)); // Wait to see result
    await browser.close();
  }
})();