const puppeteer = require('puppeteer');

async function testSimpleTab() {
  console.log('🧪 Testing simple tab click...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture all errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('🚨 Console error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
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
    
    // Try clicking Analytics tab first (it has no problematic components)
    console.log('\n🔄 Testing Analytics tab (should work)...');
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      if (tabs[4]) { // Analytics is the 5th tab (index 4)
        tabs[4].click();
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analyticsState = await page.evaluate(() => {
      const activeTab = document.querySelector('[role="tab"][data-state="active"]');
      return {
        activeTabText: activeTab ? activeTab.textContent : 'none',
        hasAnalyticsContent: document.body.textContent.includes('Kategori Prestanda'),
        errorCount: 0
      };
    });
    
    console.log('📋 Analytics tab state:', analyticsState);
    console.log('✅ Analytics tab works!');
    
    // Now test Partners tab
    console.log('\n🔄 Testing Partners tab (problematic)...');
    
    // Clear previous errors
    errors.length = 0;
    
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      if (tabs[1]) { // Partners is the 2nd tab (index 1)
        console.log('Clicking Partners tab...');
        tabs[1].click();
      }
    });
    
    // Wait a bit to see if error occurs
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if page crashed
    const pageStatus = await page.evaluate(() => {
      return {
        hasTablist: document.querySelector('[role="tablist"]') !== null,
        tabCount: document.querySelectorAll('[role="tab"]').length,
        bodyLength: document.body.innerHTML.length
      };
    }).catch(() => ({ hasTablist: false, tabCount: 0, bodyLength: 0 }));
    
    console.log('📋 Page status after Partners click:', pageStatus);
    console.log('🚨 Errors collected:', errors.length);
    
    if (errors.length > 0) {
      console.log('🚨 First error:', errors[0].substring(0, 200));
    }
    
    await page.screenshot({path: 'test-simple-tab-result.png'});
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({path: 'test-simple-tab-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testSimpleTab()
  .then(() => {
    console.log('🎉 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });