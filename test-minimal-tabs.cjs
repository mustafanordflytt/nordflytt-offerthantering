const puppeteer = require('puppeteer');

async function testMinimalTabs() {
  console.log('🧪 Testing minimal tabs implementation...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to test tabs page
    console.log('📍 Navigating to test tabs page...');
    await page.goto('http://localhost:3000/test-tabs', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check initial state
    const initialState = await page.evaluate(() => {
      const statusDiv = document.querySelector('div.bg-blue-100');
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
      
      return {
        currentTab: statusDiv ? statusDiv.textContent : 'not found',
        activeTabText: activeTab ? activeTab.textContent : 'not found',
        activePanelContent: activePanel ? activePanel.textContent : 'not found'
      };
    });
    
    console.log('📋 Initial state:', initialState);
    
    // Click Tab 2
    console.log('\n🔄 Clicking Tab 2...');
    await page.click('[role="tab"]:nth-child(2)');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const afterTab2 = await page.evaluate(() => {
      const statusDiv = document.querySelector('div.bg-blue-100');
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
      
      return {
        currentTab: statusDiv ? statusDiv.textContent : 'not found',
        activeTabText: activeTab ? activeTab.textContent : 'not found',
        activePanelContent: activePanel ? activePanel.textContent : 'not found'
      };
    });
    
    console.log('📋 After clicking Tab 2:', afterTab2);
    
    // Click the button
    console.log('\n🔄 Clicking button to go to Tab 2...');
    await page.click('button');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const afterButton = await page.evaluate(() => {
      const statusDiv = document.querySelector('div.bg-blue-100');
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      
      return {
        currentTab: statusDiv ? statusDiv.textContent : 'not found',
        activeTabText: activeTab ? activeTab.textContent : 'not found'
      };
    });
    
    console.log('📋 After button click:', afterButton);
    
    await page.screenshot({path: 'test-minimal-tabs.png'});
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({path: 'test-minimal-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testMinimalTabs()
  .then(() => {
    console.log('🎉 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });