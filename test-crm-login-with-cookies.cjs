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
      await page.waitForSelector('button:has-text("Acceptera alla")', { timeout: 5000 });
      await page.click('button:has-text("Acceptera alla")');
      console.log('✅ Clicked cookie consent');
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      // Try alternative selectors
      const acceptButton = await page.$('button[class*="primary"]');
      if (acceptButton) {
        await acceptButton.click();
        console.log('✅ Clicked cookie consent (alternative)');
      } else {
        console.log('⚠️ Cookie consent not found');
      }
    }
    
    console.log('3. Waiting for login form...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Take screenshot
    await page.screenshot({ path: 'crm-login-after-cookies.png' });
    
    // Check if form exists now
    const formExists = await page.$('form') !== null;
    console.log('Form exists:', formExists);
    
    if (formExists) {
      console.log('4. Filling login form...');
      
      // Type email
      await page.type('input[type="email"]', 'admin@nordflytt.se');
      await new Promise(r => setTimeout(r, 500));
      
      // Type password
      await page.type('input[type="password"]', 'admin123');
      await new Promise(r => setTimeout(r, 500));
      
      // Take screenshot after filling
      await page.screenshot({ path: 'crm-login-filled.png' });
      
      // Click submit
      console.log('5. Submitting form...');
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        
        // Wait for navigation or error
        await new Promise(r => setTimeout(r, 3000));
        
        // Check where we ended up
        const finalUrl = page.url();
        console.log('Final URL:', finalUrl);
        
        if (finalUrl.includes('/crm/dashboard')) {
          console.log('✅ Login successful! Redirected to dashboard');
        } else if (finalUrl.includes('/crm/login')) {
          console.log('❌ Still on login page');
          
          // Check for error messages
          const errorAlert = await page.$('[role="alert"]');
          if (errorAlert) {
            const errorText = await errorAlert.evaluate(el => el.textContent);
            console.log('Error message:', errorText);
          }
        } else {
          console.log('⚠️ Unexpected redirect to:', finalUrl);
        }
        
        await page.screenshot({ path: 'crm-login-final.png' });
        
        // Check cookies
        const cookies = await page.cookies();
        const authCookies = cookies.filter(c => 
          c.name === 'auth-token' || 
          c.name === 'crm-user' || 
          c.name === 'session-id'
        );
        console.log('Auth cookies found:', authCookies.map(c => c.name));
      } else {
        console.log('❌ Submit button not found');
      }
    } else {
      console.log('❌ Form still not found after cookie consent');
      
      // Try to find any visible text
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('Page content:', bodyText.substring(0, 300));
    }

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'crm-login-error.png' });
  } finally {
    await new Promise(r => setTimeout(r, 5000)); // Wait to see result
    await browser.close();
  }
})();