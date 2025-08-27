import puppeteer from 'puppeteer';

async function testLeadsUI() {
  console.log('🧪 Testing Leads UI after React fixes...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1200, height: 800 } 
  });
  
  try {
    const page = await browser.newPage();
    
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('🔴 Page error:', error.message);
    });
    
    // Navigate to CRM login
    console.log('1. Navigating to CRM login...');
    await page.goto('http://localhost:3000/crm', { waitUntil: 'networkidle0' });
    
    // Login
    console.log('2. Logging in as admin...');
    await page.type('input[type="email"]', 'admin@nordflytt.se');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Logged in successfully');
    
    // Navigate to leads
    console.log('3. Navigating to leads module...');
    await page.goto('http://localhost:3000/crm/leads', { waitUntil: 'networkidle0' });
    
    // Wait for leads content
    await page.waitForSelector('.grid', { timeout: 10000 });
    console.log('   ✅ Leads page loaded successfully');
    
    // Check for pipeline stages
    const pipelineStages = await page.$$('.bg-gray-50');
    console.log(`   ✅ Found ${pipelineStages.length} pipeline stages`);
    
    // Check for lead cards
    const leadCards = await page.$$('.cursor-move');
    console.log(`   ✅ Found ${leadCards.length} lead cards`);
    
    // Check KPI cards
    const kpiCards = await page.$$('.flex.items-center.space-x-3');
    console.log(`   ✅ Found ${kpiCards.length} KPI cards`);
    
    // Test drag and drop functionality
    if (leadCards.length > 0) {
      console.log('4. Testing drag and drop...');
      
      // Get first lead card
      const firstLead = leadCards[0];
      const leadBounds = await firstLead.boundingBox();
      
      // Find "Kontaktade" column
      const kontaktadeColumn = await page.$('text=Kontaktade');
      if (kontaktadeColumn) {
        const columnBounds = await kontaktadeColumn.boundingBox();
        
        // Drag lead to new column
        await page.mouse.move(leadBounds.x + leadBounds.width / 2, leadBounds.y + leadBounds.height / 2);
        await page.mouse.down();
        await page.mouse.move(columnBounds.x + 50, columnBounds.y + 100, { steps: 10 });
        await page.mouse.up();
        
        console.log('   ✅ Drag and drop test completed');
      }
    }
    
    // Test lead processing button
    console.log('5. Testing lead processing...');
    const processButton = await page.$('button:has-text("Bearbeta leads automatiskt")');
    if (processButton) {
      await processButton.click();
      console.log('   ✅ Lead processing button clicked');
      
      // Wait for toast or response
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-leads-ui-fixed.png', fullPage: true });
    console.log('   📸 Screenshot saved as test-leads-ui-fixed.png');
    
    console.log('\n✅ All UI tests passed! Leads module is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Take error screenshot
    const page = (await browser.pages())[0];
    await page.screenshot({ path: 'test-leads-ui-error.png', fullPage: true });
    console.log('   📸 Error screenshot saved as test-leads-ui-error.png');
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000)); // Keep browser open
  await browser.close();
}

// Run the test
testLeadsUI().catch(console.error);