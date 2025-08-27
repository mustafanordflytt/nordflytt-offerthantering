const puppeteer = require('puppeteer');

async function testFinalTabs() {
  console.log('🧪 Testing final tabs functionality...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('Error') || msg.type() === 'error') {
      console.error('🚨 Console error:', text);
    }
  });
  
  // Collect page errors
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
    
    // Wait for page to fully load
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    console.log('✅ Page loaded successfully');
    
    // Check initial state
    const initialState = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
      
      return {
        tabCount: tabs.length,
        tabs: tabs.map(tab => ({
          text: tab.textContent,
          state: tab.getAttribute('data-state'),
          ariaSelected: tab.getAttribute('aria-selected')
        })),
        activePanelId: activePanel ? activePanel.id : 'none',
        hasOverviewContent: activePanel ? activePanel.textContent.includes('Partner Prestanda') : false
      };
    });
    
    console.log('📋 Initial state:', JSON.stringify(initialState, null, 2));
    await page.screenshot({path: 'test-final-initial.png'});
    
    // Test Partners tab
    console.log('\n🔄 Testing Partners tab...');
    await page.click('[role="tab"]:nth-child(2)'); // Click Partners tab
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const partnersState = await page.evaluate(() => {
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
      
      return {
        activeTabText: activeTab ? activeTab.textContent : 'none',
        activePanelId: activePanel ? activePanel.id : 'none',
        hasPartnersContent: document.body.textContent.includes('Ny partner') || 
                           document.body.textContent.includes('Hantera partners'),
        errorFound: document.body.textContent.includes('Error') ||
                   document.body.textContent.includes('Maximum update depth exceeded')
      };
    });
    
    console.log('📋 Partners tab state:', partnersState);
    await page.screenshot({path: 'test-final-partners.png'});
    
    // Test Referrals tab
    console.log('\n🔄 Testing Referrals tab...');
    await page.click('[role="tab"]:nth-child(3)'); // Click Referrals tab
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const referralsState = await page.evaluate(() => {
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
      
      return {
        activeTabText: activeTab ? activeTab.textContent : 'none',
        activePanelId: activePanel ? activePanel.id : 'none',
        hasReferralsContent: document.body.textContent.includes('Totala Referrals') || 
                            document.body.textContent.includes('Referral') ||
                            document.body.textContent.includes('Konverteringsgrad'),
        errorFound: document.body.textContent.includes('Error') ||
                   document.body.textContent.includes('Maximum update depth exceeded')
      };
    });
    
    console.log('📋 Referrals tab state:', referralsState);
    await page.screenshot({path: 'test-final-referrals.png'});
    
    // Test Kickbacks tab
    console.log('\n🔄 Testing Kickbacks tab...');
    await page.click('[role="tab"]:nth-child(4)'); // Click Kickbacks tab
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const kickbacksState = await page.evaluate(() => {
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
      
      return {
        activeTabText: activeTab ? activeTab.textContent : 'none',
        activePanelId: activePanel ? activePanel.id : 'none',
        hasKickbacksContent: document.body.textContent.includes('Kickback') || 
                            document.body.textContent.includes('Utbetalning'),
        errorFound: document.body.textContent.includes('Error') ||
                   document.body.textContent.includes('Maximum update depth exceeded')
      };
    });
    
    console.log('📋 Kickbacks tab state:', kickbacksState);
    await page.screenshot({path: 'test-final-kickbacks.png'});
    
    // Test Analytics tab
    console.log('\n🔄 Testing Analytics tab...');
    await page.click('[role="tab"]:nth-child(5)'); // Click Analytics tab
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analyticsState = await page.evaluate(() => {
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
      
      return {
        activeTabText: activeTab ? activeTab.textContent : 'none',
        activePanelId: activePanel ? activePanel.id : 'none',
        hasAnalyticsContent: document.body.textContent.includes('Kategori Prestanda') || 
                            document.body.textContent.includes('Analytics'),
        errorFound: document.body.textContent.includes('Error') ||
                   document.body.textContent.includes('Maximum update depth exceeded')
      };
    });
    
    console.log('📋 Analytics tab state:', analyticsState);
    await page.screenshot({path: 'test-final-analytics.png'});
    
    // Go back to Overview
    console.log('\n🔄 Going back to Overview tab...');
    await page.click('[role="tab"]:nth-child(1)'); // Click Overview tab
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const overviewReturn = await page.evaluate(() => {
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      return {
        activeTabText: activeTab ? activeTab.textContent : 'none',
        isOverviewActive: activeTab ? activeTab.textContent.includes('Översikt') : false
      };
    });
    
    console.log('📋 Overview return state:', overviewReturn);
    await page.screenshot({path: 'test-final-overview-return.png'});
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('- Initial state OK:', initialState.hasOverviewContent);
    console.log('- Partners tab error:', partnersState.errorFound);
    console.log('- Referrals tab error:', referralsState.errorFound);
    console.log('- Kickbacks tab error:', kickbacksState.errorFound);
    console.log('- Analytics tab works:', analyticsState.hasAnalyticsContent && !analyticsState.errorFound);
    console.log('- Tab navigation works:', overviewReturn.isOverviewActive);
    
    // Check for React errors in console
    const reactErrors = consoleLogs.filter(log => 
      log.includes('Maximum update depth exceeded') || 
      log.includes('Error') ||
      log.includes('Warning')
    );
    
    if (reactErrors.length > 0) {
      console.log('\n⚠️ React errors found:', reactErrors);
    }
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({path: 'test-final-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testFinalTabs()
  .then(() => {
    console.log('🎉 All tests finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });