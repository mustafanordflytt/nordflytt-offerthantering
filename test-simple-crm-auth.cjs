const puppeteer = require('puppeteer');

async function testSimpleCRMAuth() {
  console.log('🔍 Testing Simple CRM Auth...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    devtools: true
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log(`[Browser ${msg.type()}] ${msg.text()}`);
    });
    
    console.log('1. Setting auth cookies directly...');
    
    // Set cookies before navigation
    await page.setCookie(
      {
        name: 'auth-token',
        value: '1',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false
      },
      {
        name: 'crm-user',
        value: JSON.stringify({
          id: '1',
          email: 'admin@nordflytt.se',
          role: 'admin',
          name: 'Admin User'
        }),
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false
      }
    );
    
    console.log('2. Navigating directly to CRM dashboard...');
    await page.goto('http://localhost:3000/crm/dashboard', {
      waitUntil: 'networkidle0'
    });
    
    // Wait a bit for any redirects
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalUrl = page.url();
    console.log(`3. Final URL: ${finalUrl}`);
    
    // Check page content
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasLoginForm: !!document.querySelector('form[action*="login"]'),
        hasDashboard: !!document.querySelector('[class*="dashboard"]'),
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    
    console.log('4. Page content:', pageContent);
    
    // Take screenshot
    await page.screenshot({ path: 'crm-dashboard-direct-test.png' });
    console.log('5. Screenshot saved as crm-dashboard-direct-test.png');
    
    // Try to evaluate Auth state
    const authState = await page.evaluate(() => {
      // Try to access localStorage
      const localStorageData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        localStorageData[key] = localStorage.getItem(key);
      }
      
      return {
        localStorage: localStorageData,
        cookies: document.cookie,
        pathname: window.location.pathname
      };
    });
    
    console.log('6. Auth state:', authState);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('\nTest complete. Browser will close in 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

testSimpleCRMAuth();