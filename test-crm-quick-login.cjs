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
    // Handle all cookie banners
    const cookieButtons = await page.$$('button');
    for (const button of cookieButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && (text.includes('Acceptera alla') || text.includes('Accept'))) {
        await button.click();
        console.log('✅ Clicked cookie consent:', text.trim());
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    console.log('3. Looking for quick login buttons...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'crm-login-quick-buttons.png' });
    
    // Look for Admin quick login button
    const quickLoginButtons = await page.$$('button');
    let adminButtonFound = false;
    
    for (const button of quickLoginButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.trim() === 'Admin') {
        console.log('4. Found Admin quick login button, clicking...');
        await button.click();
        adminButtonFound = true;
        break;
      }
    }
    
    if (!adminButtonFound) {
      console.log('❌ Admin quick login button not found');
      
      // List all buttons found
      console.log('Buttons found on page:');
      for (const button of quickLoginButtons) {
        const text = await button.evaluate(el => el.textContent);
        console.log(' -', text?.trim() || '(no text)');
      }
    } else {
      // Wait for potential redirect
      await new Promise(r => setTimeout(r, 3000));
      
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);
      
      if (finalUrl.includes('/crm/dashboard')) {
        console.log('✅ Quick login successful! Redirected to dashboard');
        await page.screenshot({ path: 'crm-dashboard-quick-login.png' });
      } else {
        console.log('❌ Quick login failed, still on:', finalUrl);
      }
    }
    
    // Check cookies
    const cookies = await page.cookies();
    const authCookies = cookies.filter(c => 
      c.name === 'auth-token' || 
      c.name === 'crm-user' || 
      c.name === 'crm_auth_session'
    );
    console.log('\nAuth cookies found:', authCookies.map(c => c.name));

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'crm-quick-login-error.png' });
  } finally {
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
  }
})();