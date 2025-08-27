import puppeteer from 'puppeteer';

async function testLeadsClick() {
  console.log('🧪 Testing Leads Module - Click Navigation\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1400, height: 900 } 
  });
  
  try {
    const page = await browser.newPage();
    
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
    
    // Wait for dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Logged in successfully');
    
    // Click on Leads in sidebar
    console.log('3. Clicking on Leads menu item...');
    await page.click('a[href="/crm/leads"]');
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({ path: 'test-leads-clicked.png', fullPage: true });
    console.log('📸 Screenshot saved as test-leads-clicked.png');
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);
    
    // Check page content
    const pageTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Not found');
    console.log(`📋 Page title: ${pageTitle}`);
    
    // Look for leads-specific elements
    const hasLeadsContent = await page.$('.grid.grid-cols-1.lg\\:grid-cols-7') !== null;
    const hasKanbanBoard = await page.$$('.bg-gray-50.p-4.rounded-lg').then(els => els.length);
    const hasLeadCards = await page.$$('.bg-white.rounded-lg.shadow-sm.p-4.mb-3').then(els => els.length);
    
    console.log(`\n✅ Leads page elements:`);
    console.log(`   Pipeline grid: ${hasLeadsContent ? 'Found' : 'Not found'}`);
    console.log(`   Kanban columns: ${hasKanbanBoard}`);
    console.log(`   Lead cards: ${hasLeadCards}`);
    
    if (currentUrl.includes('/crm/leads') && (hasKanbanBoard > 0 || hasLeadCards > 0)) {
      console.log('\n🎉 Success! Leads module is working correctly!');
      console.log('   - Navigation to leads page successful');
      console.log('   - Pipeline/Kanban view is displayed');
      console.log('   - Lead cards are visible');
    } else {
      console.log('\n⚠️  Leads page may not be loading correctly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testLeadsClick().catch(console.error);