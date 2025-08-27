const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Fixing customer loading issue...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('customers')) {
      console.log('Browser console:', text);
    }
  });
  
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  // Monitor API responses
  page.on('response', response => {
    if (response.url().includes('/api/crm/customers')) {
      console.log(`API Response: ${response.status()}`);
    }
  });
  
  try {
    // 1. Go to login page
    console.log('1. Navigating to login...');
    await page.goto('http://localhost:3000/crm/login', { waitUntil: 'networkidle2' });
    
    // 2. Clear all localStorage first
    console.log('\n2. Clearing localStorage...');
    await page.evaluate(() => {
      localStorage.clear();
      console.log('LocalStorage cleared');
    });
    
    // 3. Login properly
    console.log('\n3. Logging in...');
    await page.type('input[type="email"]', 'mustafa@nordflytt.se');
    await page.type('input[type="password"]', 'mustafa123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('Login successful, now at:', page.url());
    
    // 4. Navigate to customers
    console.log('\n4. Going to customers page...');
    await page.goto('http://localhost:3000/crm/kunder', { waitUntil: 'networkidle2' });
    
    // 5. Wait for content to load
    console.log('\n5. Waiting for customers to load...');
    
    // Wait for either table or error
    await page.waitForSelector('table, [role="alert"], .text-center', { timeout: 10000 });
    
    // 6. Check what's on the page
    const pageState = await page.evaluate(() => {
      const loadingText = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent && el.textContent.includes('Laddar kunder')
      );
      
      const table = document.querySelector('table');
      const rows = document.querySelectorAll('tbody tr');
      const errorElement = document.querySelector('[role="alert"]');
      
      // Check localStorage
      const crmCustomers = localStorage.getItem('crm-customers');
      let storedData = null;
      if (crmCustomers) {
        try {
          storedData = JSON.parse(crmCustomers);
        } catch (e) {}
      }
      
      // Check for stats cards
      const statsText = Array.from(document.querySelectorAll('.card')).map(card => {
        const text = card.textContent || '';
        return text.substring(0, 100);
      });
      
      return {
        hasLoading: !!loadingText,
        hasTable: !!table,
        rowCount: rows.length,
        hasError: !!errorElement,
        errorText: errorElement?.textContent,
        storedCustomers: storedData?.state?.customers?.length || 0,
        statsText,
        pageTitle: document.querySelector('h1')?.textContent,
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean)
      };
    });
    
    console.log('\n6. Page state:', JSON.stringify(pageState, null, 2));
    
    await page.screenshot({ path: 'customers-fixed.png', fullPage: true });
    
    // 7. If still loading, manually trigger a refresh
    if (pageState.hasLoading || (!pageState.hasTable && pageState.rowCount === 0)) {
      console.log('\n7. Still loading, triggering manual refresh...');
      
      // Try clicking the Update button
      const updateButton = await page.$('button:has-text("Uppdatera")').catch(() => null);
      if (updateButton) {
        console.log('Found Update button, clicking...');
        await updateButton.click();
        await page.waitForTimeout(2000);
      } else {
        // Try using evaluateHandle
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const updateBtn = buttons.find(b => b.textContent?.includes('Uppdatera'));
          if (updateBtn) {
            updateBtn.click();
          }
        });
        await page.waitForTimeout(2000);
      }
      
      // Check state again
      const finalState = await page.evaluate(() => {
        const rows = document.querySelectorAll('tbody tr');
        return {
          rowCount: rows.length,
          firstRowText: rows[0]?.textContent?.substring(0, 100)
        };
      });
      
      console.log('\n8. Final state after refresh:', finalState);
      await page.screenshot({ path: 'customers-after-refresh.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'customers-error.png' });
  }
  
  console.log('\n✅ Done! Check screenshots:');
  console.log('- customers-fixed.png');
  console.log('- customers-after-refresh.png');
  console.log('\n👀 Browser left open for manual inspection.');
})();