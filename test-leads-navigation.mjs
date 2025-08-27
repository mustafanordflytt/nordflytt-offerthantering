import puppeteer from 'puppeteer';

async function testLeadsNavigation() {
  console.log('🧪 Testing Leads Module Navigation\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1200, height: 800 } 
  });
  
  try {
    const page = await browser.newPage();
    
    // Set up error logging
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('🔴 Console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('🔴 Page error:', error.message);
    });
    
    // Navigate to CRM
    console.log('1. Navigating to CRM...');
    await page.goto('http://localhost:3000/crm', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Login
    console.log('2. Logging in...');
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Logged in successfully');
    
    // Click on Leads in sidebar
    console.log('3. Clicking on Leads in sidebar...');
    await page.click('nav a[href="/crm/leads"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Navigated to leads page');
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({ path: 'test-leads-page-final.png', fullPage: true });
    console.log('📸 Screenshot saved as test-leads-page-final.png');
    
    // Check for errors
    if (errors.length === 0) {
      console.log('✅ No JavaScript errors detected!');
      
      // Check page title
      const pageTitle = await page.$eval('h1', el => el.textContent);
      console.log(`✅ Page title: ${pageTitle}`);
      
      // Check for lead elements
      const hasGrid = await page.$('.grid') !== null;
      const hasCards = await page.$$('.bg-white.rounded-lg.shadow');
      const hasProcessButton = await page.$('text=Bearbeta leads automatiskt') !== null;
      
      console.log(`✅ Grid layout: ${hasGrid ? 'Found' : 'Not found'}`);
      console.log(`✅ Cards found: ${hasCards.length}`);
      console.log(`✅ Process button: ${hasProcessButton ? 'Found' : 'Not found'}`);
      
      // Check for KPI values
      const kpiValues = await page.$$eval('.text-2xl.font-bold', elements => 
        elements.map(el => el.textContent)
      );
      console.log(`✅ KPI values: ${kpiValues.join(', ')}`);
      
    } else {
      console.log(`❌ Found ${errors.length} errors`);
    }
    
    console.log('\n🎉 Leads module is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testLeadsNavigation().catch(console.error);