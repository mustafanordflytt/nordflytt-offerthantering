const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing Kunder module final...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/crm/login', { waitUntil: 'networkidle2' });
    
    await page.type('input[type="email"]', 'mustafa@nordflytt.se');
    await page.type('input[type="password"]', 'mustafa123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);
    
    // 2. Navigate to Kunder
    console.log('\n2. Navigating to Kunder...');
    await page.goto('http://localhost:3000/crm/kunder', { waitUntil: 'networkidle2' });
    
    // Wait a bit for data to load
    await page.waitForTimeout(3000);
    
    // 3. Check content
    console.log('\n3. Checking page content...');
    
    const pageContent = await page.evaluate(() => {
      const loadingElement = document.querySelector('text:contains("Laddar kunder"), *:contains("Laddar kunder")');
      const hasLoading = Array.from(document.querySelectorAll('*')).some(el => 
        el.textContent && el.textContent.includes('Laddar kunder')
      );
      
      const tableRows = document.querySelectorAll('tbody tr');
      const hasTable = !!document.querySelector('table');
      const errorElement = document.querySelector('[role="alert"], .error, .text-red-500');
      
      // Check for buttons
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean);
      
      // Check for stats cards
      const statsCards = Array.from(document.querySelectorAll('.card, [class*="card"]')).length;
      
      return {
        hasLoading,
        hasTable,
        tableRowCount: tableRows.length,
        hasError: !!errorElement,
        errorText: errorElement?.textContent,
        buttons,
        statsCards,
        pageText: document.body.innerText.substring(0, 500)
      };
    });
    
    console.log('Page analysis:', JSON.stringify(pageContent, null, 2));
    
    await page.screenshot({ path: 'customers-final.png', fullPage: true });
    
    // 4. Try to click "Ny kund" button if it exists
    console.log('\n4. Looking for New Customer button...');
    const newCustomerButton = await page.$('button:has-text("Ny"), button:has-text("Lägg till")')
      .catch(() => null);
    
    if (newCustomerButton) {
      console.log('Found button, clicking...');
      await newCustomerButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'customers-new-modal.png' });
    } else {
      // Try using text search
      const buttonWithText = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent?.includes('Ny') || b.textContent?.includes('Lägg till'));
      });
      
      if (buttonWithText) {
        await buttonWithText.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'customers-new-modal.png' });
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'customers-error-final.png' });
  }
  
  console.log('\n📸 Screenshots saved!');
  console.log('- customers-final.png');
  console.log('- customers-new-modal.png (if button found)');
  console.log('- customers-error-final.png (if error)');
  
  console.log('\n👀 Browser left open for inspection. Press Ctrl+C to close.');
})();