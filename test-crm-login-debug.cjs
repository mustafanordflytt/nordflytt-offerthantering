const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Enable console logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('pageerror', error => console.log('Page error:', error.message));

    console.log('1. Navigating to CRM login page...');
    await page.goto('http://localhost:3001/crm/login', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('2. Waiting for page to load...');
    await page.waitForTimeout(2000);
    
    // Take screenshot of what we see
    await page.screenshot({ path: 'crm-login-debug.png' });
    
    // Check page content
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    
    // Try to find any form on the page
    const forms = await page.$$('form');
    console.log('Forms found:', forms.length);
    
    // Try to find the login component specifically
    const loginComponent = await page.$('[data-testid="crm-login-form"]');
    console.log('Login component found:', !!loginComponent);
    
    // Check for any error messages
    const errorDivs = await page.$$('[class*="error"]');
    console.log('Error elements found:', errorDivs.length);
    
    // Check if we were redirected
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Try clicking the "Quick Login" button for admin if it exists
    const quickLoginButtons = await page.$$('button');
    console.log('Buttons found:', quickLoginButtons.length);
    
    // Look for email input in different ways
    const emailInputs = await page.$$('input[type="email"], input[name="email"], input[id="email"]');
    console.log('Email inputs found:', emailInputs.length);

    // Wait a bit more
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'crm-login-error.png' });
  } finally {
    await browser.close();
  }
})();