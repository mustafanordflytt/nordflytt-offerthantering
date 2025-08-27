const puppeteer = require('puppeteer');

async function testSupabaseAuth() {
  console.log('🔍 Testing Supabase Authentication...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Browser error] ${msg.text()}`);
      }
    });
    
    // Monitor network requests
    page.on('requestfailed', request => {
      console.log(`[Network failed] ${request.url()}`);
    });
    
    // 1. Go to CRM login page
    console.log('1. Going to CRM login page...');
    await page.goto('http://localhost:3000/crm/login');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Try login with Supabase credentials
    console.log('2. Attempting login with admin@nordflytt.se...');
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    
    // Take screenshot before login
    await page.screenshot({ path: 'test-before-login.png' });
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'test-after-login.png' });
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`\nCurrent URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful! Redirected to dashboard');
      
      // Test API call
      console.log('\n3. Testing API call to customers...');
      await page.goto('http://localhost:3000/crm/kunder');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if data loads
      const hasData = await page.evaluate(() => {
        const rows = document.querySelectorAll('tbody tr');
        return rows.length > 0;
      });
      
      console.log(`   Customer data loaded: ${hasData ? 'Yes' : 'No'}`);
      
      // Take final screenshot
      await page.screenshot({ path: 'test-customers-page.png' });
    } else {
      console.log('❌ Login failed - still on login page');
      
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const errors = Array.from(document.querySelectorAll('.text-red-500, .text-destructive, [role="alert"]'));
        return errors.map(el => el.textContent).join('\n');
      });
      
      if (errorText) {
        console.log('Error message:', errorText);
      }
    }
    
    // Check localStorage
    const authData = await page.evaluate(() => {
      return {
        crmUser: localStorage.getItem('crm-user'),
        authToken: localStorage.getItem('auth-token'),
        crmToken: localStorage.getItem('crm-token')
      };
    });
    
    console.log('\n📊 Auth data in localStorage:');
    console.log('   crm-user:', authData.crmUser ? 'Present' : 'Missing');
    console.log('   auth-token:', authData.authToken ? 'Present' : 'Missing');
    console.log('   crm-token:', authData.crmToken ? 'Present' : 'Missing');
    
    // Check cookies
    const cookies = await page.cookies();
    const authCookies = cookies.filter(c => c.name.includes('auth') || c.name.includes('crm'));
    console.log('\n🍪 Auth cookies:', authCookies.length);
    authCookies.forEach(c => console.log(`   - ${c.name}: ${c.value.substring(0, 20)}...`));
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('\nTest complete. Browser will close in 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

testSupabaseAuth().catch(console.error);