const puppeteer = require('puppeteer');

async function testCRMFunctionality() {
  console.log('🔍 Testing CRM with Supabase Auth...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' || text.includes('error') || text.includes('Error')) {
        console.log(`[Browser ${type}] ${text}`);
      }
    });
    
    // 1. Login
    console.log('1. Logging in with admin@nordflytt.se...');
    await page.goto('http://localhost:3000/crm/login');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    
    await page.click('button[type="submit"]');
    
    // Wait for either navigation or error
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      new Promise(resolve => setTimeout(resolve, 5000))
    ]);
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful!\n');
      
      // 2. Test Customers module
      console.log('2. Testing Customers module...');
      await page.goto('http://localhost:3000/crm/kunder');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take screenshot
      await page.screenshot({ path: 'test-customers-supabase.png' });
      
      // Check for customer data
      const customerData = await page.evaluate(() => {
        const rows = document.querySelectorAll('tbody tr');
        const cards = document.querySelectorAll('[class*="customer"]');
        const emptyState = document.querySelector('[class*="Inga kunder"]');
        
        return {
          rowCount: rows.length,
          cardCount: cards.length,
          hasEmptyState: !!emptyState,
          pageTitle: document.title
        };
      });
      
      console.log(`   Rows: ${customerData.rowCount}`);
      console.log(`   Cards: ${customerData.cardCount}`);
      console.log(`   Empty state: ${customerData.hasEmptyState}`);
      
      // Check for "Ny Kund" button
      const newCustomerButton = await page.$('a[href="/crm/kunder/new"], button:has-text("Ny Kund")');
      console.log(`   "Ny Kund" button: ${newCustomerButton ? 'Found' : 'Not found'}\n`);
      
      // 3. Test API directly
      console.log('3. Testing API endpoint...');
      const apiResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/crm/customers', {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          return {
            status: response.status,
            ok: response.ok,
            data: response.ok ? await response.json() : null
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      console.log(`   API Status: ${apiResponse.status}`);
      if (apiResponse.data) {
        console.log(`   Customer count: ${apiResponse.data.customers?.length || 0}`);
      }
      
    } else {
      console.log('❌ Login failed');
      
      // Check for error message
      const errorText = await page.evaluate(() => {
        const alerts = document.querySelectorAll('[role="alert"], .text-red-500, .text-destructive');
        return Array.from(alerts).map(el => el.textContent).join(' | ');
      });
      
      if (errorText) {
        console.log(`   Error: ${errorText}`);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('\nTest complete. Browser will close in 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

testCRMFunctionality().catch(console.error);