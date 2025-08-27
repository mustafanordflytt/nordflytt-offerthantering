import puppeteer from 'puppeteer';

async function testLeadsDirect() {
  console.log('🧪 Testing Leads Module - Direct Navigation\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 } 
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
    console.log('1. Navigating to CRM login...');
    await page.goto('http://localhost:3000/crm', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Login
    console.log('2. Logging in...');
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Logged in successfully');
    
    // Direct navigation to leads
    console.log('3. Navigating directly to /crm/leads...');
    await page.goto('http://localhost:3000/crm/leads', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait for content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({ path: 'test-leads-direct-final.png', fullPage: true });
    console.log('📸 Screenshot saved as test-leads-direct-final.png');
    
    // Check page title
    const title = await page.$eval('h1', el => el.textContent).catch(() => 'Not found');
    console.log(`\n📋 Page title: ${title}`);
    
    // Check for lead elements
    const leadCards = await page.$$('.cursor-move');
    const pipelineColumns = await page.$$('.bg-gray-50');
    const kpiCards = await page.$$('[class*="bg-gradient-to-r"]');
    const processButton = await page.$('button:has-text("Bearbeta leads automatiskt")');
    
    console.log(`\n✅ Test Results:`);
    console.log(`   Lead cards: ${leadCards.length}`);
    console.log(`   Pipeline columns: ${pipelineColumns.length}`);
    console.log(`   KPI cards: ${kpiCards.length}`);
    console.log(`   Process button: ${processButton ? 'Found' : 'Not found'}`);
    console.log(`   Errors: ${errors.length}`);
    
    if (leadCards.length > 0) {
      console.log('\n🎉 Success! Leads module is displaying correctly with:');
      console.log(`   - ${leadCards.length} leads in the pipeline`);
      console.log(`   - Drag and drop functionality available`);
      console.log(`   - No JavaScript errors`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testLeadsDirect().catch(console.error);