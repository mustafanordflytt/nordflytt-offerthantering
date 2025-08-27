const puppeteer = require('puppeteer');

async function debugAuth() {
  console.log('🔍 Debugging authentication flow...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    devtools: true
  });

  try {
    const page = await browser.newPage();
    
    // Intercept all console messages
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Intercept network requests
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('auth')) {
        console.log(`[Request] ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('auth')) {
        console.log(`[Response] ${response.status()} ${response.url()}`);
      }
    });
    
    // 1. Navigate to login page
    console.log('\n1. Navigating to login page...');
    await page.goto('http://localhost:3000/crm/login', { waitUntil: 'networkidle2' });
    
    // 2. Check if Supabase is loaded
    const supabaseCheck = await page.evaluate(() => {
      return {
        hasSupabase: typeof window.supabase !== 'undefined',
        hasWindow: typeof window !== 'undefined'
      };
    });
    
    console.log('\n2. Supabase check:', supabaseCheck);
    
    // 3. Fill login form
    console.log('\n3. Filling login form...');
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    
    // 4. Click submit and wait
    console.log('\n4. Submitting form...');
    
    // Set up promise to catch navigation
    const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => null);
    
    await page.click('button[type="submit"]');
    
    // Wait for navigation or timeout
    await Promise.race([
      navigationPromise,
      new Promise(resolve => setTimeout(resolve, 5000))
    ]);
    
    // 5. Check results
    console.log('\n5. Checking results...');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Check localStorage and cookies
    const authData = await page.evaluate(() => {
      return {
        localStorage: {
          'crm-user': localStorage.getItem('crm-user'),
          'auth-token': localStorage.getItem('auth-token'),
          'crm-token': localStorage.getItem('crm-token'),
          'sb-gindcnpiejkntkangpuc-auth-token': localStorage.getItem('sb-gindcnpiejkntkangpuc-auth-token')
        },
        cookies: document.cookie
      };
    });
    
    console.log('\n6. Auth data:');
    console.log('   localStorage:', JSON.stringify(authData.localStorage, null, 2));
    console.log('   cookies:', authData.cookies);
    
    // Check for errors
    const errors = await page.$$eval('[role="alert"], .text-red-500, .text-destructive', 
      elements => elements.map(el => el.textContent)
    );
    
    if (errors.length > 0) {
      console.log('\n7. Errors found:', errors);
    }
    
  } catch (error) {
    console.error('\nTest error:', error);
  } finally {
    console.log('\n\nDebug complete. Browser will remain open for inspection...');
    // Keep browser open for manual inspection
    await new Promise(resolve => setTimeout(resolve, 60000));
    await browser.close();
  }
}

debugAuth().catch(console.error);