const puppeteer = require('puppeteer');

async function testDebugButtons() {
  console.log('🧪 Testing debug buttons and state management...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Monitor console for errors
  page.on('pageerror', error => {
    console.error('🚨 Page error:', error.message);
  });
  
  try {
    // Navigate to samarbeten page
    console.log('📍 Navigating to Samarbeten page...');
    await page.goto('http://localhost:3000/crm/samarbeten', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    console.log('✅ Page loaded');
    
    // Check initial state
    const initialState = await page.evaluate(() => {
      const debugDiv = document.querySelector('div.bg-yellow-100');
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      
      return {
        debugText: debugDiv ? debugDiv.textContent : 'not found',
        activeTabText: activeTab ? activeTab.textContent : 'not found'
      };
    });
    
    console.log('📋 Initial state:', initialState);
    
    // Click Set Partners button
    console.log('\n🔄 Clicking Set Partners button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const partnersButton = buttons.find(btn => btn.textContent.includes('Set Partners'));
      if (partnersButton) partnersButton.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const afterPartnersButton = await page.evaluate(() => {
      const debugDiv = document.querySelector('div.bg-yellow-100');
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
      
      return {
        debugText: debugDiv ? debugDiv.textContent : 'not found',
        activeTabText: activeTab ? activeTab.textContent : 'not found',
        activePanelId: activePanel ? activePanel.id : 'not found',
        pageIntact: document.querySelector('[role="tablist"]') !== null
      };
    });
    
    console.log('📋 After Set Partners button:', afterPartnersButton);
    
    // If page is still intact, try clicking Partners tab
    if (afterPartnersButton.pageIntact) {
      console.log('\n🔄 Clicking Partners tab...');
      await page.evaluate(() => {
        const partnersTab = Array.from(document.querySelectorAll('[role="tab"]')).find(tab => 
          tab.textContent === 'Partners'
        );
        if (partnersTab) partnersTab.click();
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const afterTabClick = await page.evaluate(() => {
        const debugDiv = document.querySelector('div.bg-yellow-100');
        const activeTab = document.querySelector('[role="tab"][data-state="active"]');
        
        return {
          debugText: debugDiv ? debugDiv.textContent : 'not found',
          activeTabText: activeTab ? activeTab.textContent : 'not found',
          pageIntact: document.querySelector('[role="tablist"]') !== null
        };
      });
      
      console.log('📋 After Partners tab click:', afterTabClick);
    }
    
    // Try Set Referrals button
    console.log('\n🔄 Clicking Set Referrals button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const referralsButton = buttons.find(btn => btn.textContent.includes('Set Referrals'));
      if (referralsButton) referralsButton.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const afterReferralsButton = await page.evaluate(() => {
      const debugDiv = document.querySelector('div.bg-yellow-100');
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      
      return {
        debugText: debugDiv ? debugDiv.textContent : 'not found',
        activeTabText: activeTab ? activeTab.textContent : 'not found',
        pageIntact: document.querySelector('[role="tablist"]') !== null
      };
    });
    
    console.log('📋 After Set Referrals button:', afterReferralsButton);
    
    await page.screenshot({path: 'test-debug-buttons.png'});
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({path: 'test-debug-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testDebugButtons()
  .then(() => {
    console.log('🎉 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });