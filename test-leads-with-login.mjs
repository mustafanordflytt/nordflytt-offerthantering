import puppeteer from 'puppeteer';

async function testLeadsWithLogin() {
  console.log('🧪 Testing Leads Module with Proper Login\n');
  
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
    
    // Wait for server
    console.log('1. Waiting for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate to CRM
    console.log('2. Navigating to CRM...');
    await page.goto('http://localhost:3000/crm', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Check if we're on login page
    const isLoginPage = await page.$('input[type="email"]') !== null;
    
    if (isLoginPage) {
      console.log('3. Logging in...');
      
      // Fill login form
      await page.type('input[type="email"]', 'admin@nordflytt.se');
      await page.type('input[type="password"]', 'admin123');
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      console.log('   ✅ Logged in successfully');
    }
    
    // Navigate to leads
    console.log('4. Navigating to leads module...');
    await page.goto('http://localhost:3000/crm/leads', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({ path: 'test-leads-after-login.png', fullPage: true });
    console.log('📸 Screenshot saved as test-leads-after-login.png');
    
    // Check for errors
    if (errors.length === 0) {
      console.log('✅ No JavaScript errors detected!');
      
      // Check for key elements
      const hasGrid = await page.$('.grid') !== null;
      const hasPipeline = await page.$('.bg-gray-50') !== null;
      const hasKPICards = await page.$('.flex.items-center.space-x-3') !== null;
      const hasProcessButton = await page.$('button:has-text("Bearbeta leads automatiskt")') !== null;
      
      console.log(`✅ Grid layout: ${hasGrid ? 'Found' : 'Not found'}`);
      console.log(`✅ Pipeline columns: ${hasPipeline ? 'Found' : 'Not found'}`);
      console.log(`✅ KPI cards: ${hasKPICards ? 'Found' : 'Not found'}`);
      console.log(`✅ Process button: ${hasProcessButton ? 'Found' : 'Not found'}`);
      
      // Count lead cards
      const leadCards = await page.$$('.cursor-move');
      console.log(`✅ Lead cards found: ${leadCards.length}`);
      
    } else {
      console.log(`❌ Found ${errors.length} errors:`);
      errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-leads-error.png', fullPage: true });
    console.log('📸 Error screenshot saved');
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testLeadsWithLogin().catch(console.error);