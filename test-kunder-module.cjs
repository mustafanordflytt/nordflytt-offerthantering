const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing Kunder module...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  // Monitor network requests
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`API Response: ${response.url()} - ${response.status()}`);
    }
  });
  
  try {
    // 1. Login first
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/crm/login', { waitUntil: 'networkidle2' });
    
    // Quick login
    await page.evaluate(() => {
      const user = {
        id: '6a8589db-f55a-4e97-bd46-1dfb8b725909',
        email: 'mustafa@nordflytt.se',
        name: 'Mustafa Abdulkarim',
        role: 'admin',
        permissions: ['*']
      };
      localStorage.setItem('crm-user', JSON.stringify(user));
      localStorage.setItem('crm-token', 'mustafa-admin-token');
    });
    
    // 2. Navigate to Kunder
    console.log('\n2. Navigating to Kunder module...');
    await page.goto('http://localhost:3000/crm/kunder', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => true, { timeout: 2000 }).catch(() => {});
    await page.screenshot({ path: 'kunder-page.png' });
    
    // 3. Check for customer data
    console.log('\n3. Checking for customer data...');
    const customersCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });
    console.log(`Found ${customersCount} customer rows`);
    
    // 4. Try to click "Ny kund" button
    console.log('\n4. Looking for "Ny kund" button...');
    const newCustomerButton = await page.$('button:has-text("Ny kund"), button:has-text("Lägg till kund"), button:has-text("+")')
    if (newCustomerButton) {
      console.log('Found new customer button, clicking...');
      await newCustomerButton.click();
      await page.waitForFunction(() => true, { timeout: 1000 }).catch(() => {});
      await page.screenshot({ path: 'kunder-new-modal.png' });
    } else {
      console.log('❌ No "Ny kund" button found');
    }
    
    // 5. Check for search functionality
    console.log('\n5. Checking search functionality...');
    const searchInput = await page.$('input[placeholder*="Sök"], input[type="search"]');
    if (searchInput) {
      console.log('Found search input, typing...');
      await searchInput.type('test');
      await page.waitForFunction(() => true, { timeout: 1000 }).catch(() => {});
    } else {
      console.log('❌ No search input found');
    }
    
    // 6. Check page structure
    console.log('\n6. Analyzing page structure...');
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.querySelector('h1')?.textContent,
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent),
        forms: document.querySelectorAll('form').length,
        tables: document.querySelectorAll('table').length,
        errorMessages: Array.from(document.querySelectorAll('[role="alert"], .error, .text-red-500')).map(e => e.textContent)
      };
    });
    console.log('Page info:', JSON.stringify(pageInfo, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'kunder-error.png' });
  }
  
  console.log('\n📸 Screenshots saved!');
  console.log('- kunder-page.png');
  console.log('- kunder-new-modal.png (if modal opened)');
  console.log('- kunder-error.png (if error occurred)');
  
  console.log('\n👀 Browser left open for inspection. Press Ctrl+C to close.');
})();