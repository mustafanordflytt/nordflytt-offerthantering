const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing Kunder CRUD functionality...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  // Monitor API calls
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`API: ${response.url()} - Status: ${response.status()}`);
    }
  });
  
  try {
    // 1. Login properly
    console.log('1. Logging in with proper credentials...');
    await page.goto('http://localhost:3000/crm/login', { waitUntil: 'networkidle2' });
    
    // Fill login form
    await page.type('input[type="email"]', 'mustafa@nordflytt.se');
    await page.type('input[type="password"]', 'mustafa123');
    
    // Click login button
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('Current URL after login:', page.url());
    
    // 2. Navigate to Kunder
    console.log('\n2. Navigating to Kunder module...');
    await page.goto('http://localhost:3000/crm/kunder', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'customers-page.png' });
    
    // Wait for page to load
    await page.waitForSelector('body', { timeout: 5000 });
    
    // 3. Check page content
    console.log('\n3. Analyzing page content...');
    const pageContent = await page.evaluate(() => {
      return {
        title: document.querySelector('h1, h2')?.textContent,
        url: window.location.href,
        hasTable: !!document.querySelector('table'),
        rowCount: document.querySelectorAll('tbody tr').length,
        buttons: Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.textContent?.trim(),
          disabled: b.disabled
        })),
        inputs: Array.from(document.querySelectorAll('input')).map(i => ({
          type: i.type,
          placeholder: i.placeholder,
          name: i.name
        })),
        error: document.querySelector('.error, [role="alert"]')?.textContent
      };
    });
    
    console.log('Page content:', JSON.stringify(pageContent, null, 2));
    
    // 4. Check API endpoints
    console.log('\n4. Checking customer API...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const token = localStorage.getItem('crm-token');
        const response = await fetch('/api/crm/customers', {
          headers: {
            'Authorization': `Bearer ${token}`,
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
    
    console.log('API Response:', JSON.stringify(apiResponse, null, 2));
    
    // 5. Look for CRUD buttons
    console.log('\n5. Looking for CRUD buttons...');
    const crudButtons = await page.evaluate(() => {
      const buttons = {
        create: null,
        edit: [],
        delete: [],
        search: null
      };
      
      // Look for create button
      const createBtn = document.querySelector('button:has-text("Ny"), button:has-text("Lägg till"), button:has-text("Skapa"), button:has([class*="plus"])')
      if (createBtn) {
        buttons.create = createBtn.textContent;
      }
      
      // Look for edit buttons
      document.querySelectorAll('button:has-text("Redigera"), button:has-text("Ändra"), button:has([class*="edit"]), button:has([class*="pencil"])').forEach(btn => {
        buttons.edit.push(btn.textContent);
      });
      
      // Look for delete buttons
      document.querySelectorAll('button:has-text("Ta bort"), button:has-text("Radera"), button:has([class*="trash"]), button:has([class*="delete"])').forEach(btn => {
        buttons.delete.push(btn.textContent);
      });
      
      // Look for search
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="Sök"]');
      if (searchInput) {
        buttons.search = searchInput.placeholder;
      }
      
      return buttons;
    });
    
    console.log('CRUD buttons found:', JSON.stringify(crudButtons, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'customers-error.png' });
  }
  
  console.log('\n📸 Screenshots saved!');
  console.log('- customers-page.png');
  console.log('- customers-error.png (if error)');
  
  console.log('\n👀 Browser left open for inspection. Press Ctrl+C to close.');
})();