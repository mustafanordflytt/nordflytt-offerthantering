const puppeteer = require('puppeteer');

async function testCRUDFunctionality() {
  console.log('🔍 Testing CRM CRUD Functionality...\n');
  
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
    
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/crm/login');
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('✅ Logged in successfully\n');
    
    // 2. Test Customers module
    console.log('2. Testing Customers module...');
    await page.goto('http://localhost:3000/crm/kunder');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({ path: 'test-customers-page.png' });
    
    // Check if customer data is displayed
    const customerCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr, .customer-card, [class*="customer"]');
      return rows.length;
    });
    
    console.log(`   Found ${customerCount} customer rows/cards`);
    
    // Check for "Ny Kund" button
    const newCustomerButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const nyKundButton = buttons.find(btn => 
        btn.textContent && btn.textContent.includes('Ny Kund')
      );
      return nyKundButton ? nyKundButton.textContent : null;
    });
    
    if (newCustomerButton) {
      console.log(`   ✅ Found "Ny Kund" button: "${newCustomerButton}"`);
      
      // Try to click it
      const clickable = await page.$('a[href="/crm/kunder/new"], button:has-text("Ny Kund")');
      if (clickable) {
        await clickable.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const currentUrl = page.url();
        console.log(`   After click, URL: ${currentUrl}`);
        
        if (currentUrl.includes('/kunder/new')) {
          console.log('   ✅ Successfully navigated to new customer form');
          await page.screenshot({ path: 'test-new-customer-form.png' });
        }
      }
    } else {
      console.log('   ❌ "Ny Kund" button not found');
    }
    
    // 3. Test Leads module
    console.log('\n3. Testing Leads module...');
    await page.goto('http://localhost:3000/crm/leads');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const leadCount = await page.evaluate(() => {
      const cards = document.querySelectorAll('.lead-card, [class*="lead"], .kanban-card');
      return cards.length;
    });
    
    console.log(`   Found ${leadCount} lead cards`);
    
    // 4. Test Jobs module
    console.log('\n4. Testing Jobs module...');
    await page.goto('http://localhost:3000/crm/uppdrag');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const jobCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr, .job-card, [class*="uppdrag"]');
      return rows.length;
    });
    
    console.log(`   Found ${jobCount} job rows/cards`);
    
    // 5. Check API calls
    console.log('\n5. Checking API responses...');
    
    // Intercept API responses
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(`   API: ${url} - Status: ${response.status()}`);
      }
    });
    
    // Reload customers page to catch API calls
    await page.goto('http://localhost:3000/crm/kunder');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Final summary
    console.log('\n📊 Summary:');
    console.log(`   - Customers module: ${customerCount > 0 ? '✅ Has data' : '❌ No data'}`);
    console.log(`   - Leads module: ${leadCount > 0 ? '✅ Has data' : '❌ No data'}`);
    console.log(`   - Jobs module: ${jobCount > 0 ? '✅ Has data' : '❌ No data'}`);
    console.log(`   - CRUD buttons: ${newCustomerButton ? '✅ Found' : '❌ Not found'}`);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('\nTest complete. Browser will close in 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

testCRUDFunctionality().catch(console.error);