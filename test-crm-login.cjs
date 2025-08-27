const puppeteer = require('puppeteer');

async function testCRMLogin() {
  console.log('🔍 Testing CRM Login...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });

  try {
    const page = await browser.newPage();
    
    // Log all console messages
    page.on('console', msg => {
      console.log(`Browser console ${msg.type()}: ${msg.text()}`);
    });
    
    // Log network requests
    page.on('response', response => {
      if (response.url().includes('login') || response.url().includes('auth')) {
        console.log(`Response: ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('1. Navigating to CRM login page...');
    await page.goto('http://localhost:3000/crm/login', {
      waitUntil: 'networkidle0'
    });
    
    // Wait for any cookie banner and try to close it
    try {
      const cookieBanner = await page.$('[class*="cookie"]');
      if (cookieBanner) {
        console.log('2. Cookie banner detected, trying to close it...');
        
        // Try to click "Accept all" button
        const acceptButton = await page.$('button:has-text("Acceptera alla"), button:has-text("Accept all")');
        if (acceptButton) {
          await acceptButton.click();
          console.log('   ✓ Clicked accept cookies');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (e) {
      console.log('   - No cookie banner or already closed');
    }
    
    // Check current URL
    console.log(`3. Current URL: ${page.url()}`);
    
    // Check if login form is visible
    const loginForm = await page.$('form');
    if (!loginForm) {
      console.log('❌ Login form not found!');
      
      // Take screenshot
      await page.screenshot({ path: 'crm-login-page-error.png' });
      console.log('   Screenshot saved as crm-login-page-error.png');
      return;
    }
    
    console.log('4. Login form found, attempting to log in...');
    
    // Try to login with admin credentials
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    
    console.log('5. Credentials entered, clicking login button...');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check final URL
    const finalUrl = page.url();
    console.log(`6. Final URL: ${finalUrl}`);
    
    // Check for error messages
    const errorAlert = await page.$('[role="alert"]');
    if (errorAlert) {
      const errorText = await errorAlert.textContent();
      console.log(`❌ Error message: ${errorText}`);
    }
    
    // Check cookies
    const cookies = await page.cookies();
    console.log('\n7. Cookies set:');
    cookies.forEach(cookie => {
      console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
    });
    
    // Take final screenshot
    await page.screenshot({ path: 'crm-login-final-state.png' });
    console.log('\n8. Screenshot saved as crm-login-final-state.png');
    
    // Try to navigate directly to dashboard
    console.log('\n9. Attempting direct navigation to dashboard...');
    await page.goto('http://localhost:3000/crm/dashboard', {
      waitUntil: 'networkidle0'
    });
    
    const dashboardUrl = page.url();
    console.log(`   Dashboard URL: ${dashboardUrl}`);
    
    if (dashboardUrl.includes('login')) {
      console.log('   ❌ Still redirected to login');
    } else {
      console.log('   ✅ Successfully accessed dashboard');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('\nTest complete. Browser will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testCRMLogin();