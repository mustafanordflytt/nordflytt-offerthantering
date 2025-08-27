const puppeteer = require('puppeteer');

async function testControlledTabs() {
  console.log('🧪 Testing controlled tabs state...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Enable devtools to see React state
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to samarbeten page
    console.log('📍 Navigating to Samarbeten page...');
    await page.goto('http://localhost:3000/crm/samarbeten', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    console.log('✅ Page loaded');
    
    // Check if tabs are using controlled state
    const tabsInfo = await page.evaluate(() => {
      const tabsRoot = document.querySelector('[data-orientation="horizontal"]');
      const tabs = document.querySelectorAll('[role="tab"]');
      const panels = document.querySelectorAll('[role="tabpanel"]');
      
      // Try to find React props
      let reactProps = null;
      if (tabsRoot) {
        const reactKey = Object.keys(tabsRoot).find(key => key.startsWith('__reactProps'));
        if (reactKey) {
          reactProps = {
            value: tabsRoot[reactKey].value,
            defaultValue: tabsRoot[reactKey].defaultValue,
            onValueChange: typeof tabsRoot[reactKey].onValueChange
          };
        }
      }
      
      return {
        tabCount: tabs.length,
        panelCount: panels.length,
        reactProps: reactProps,
        tabsData: Array.from(tabs).map((tab, index) => ({
          index: index,
          text: tab.textContent,
          value: tab.getAttribute('value'),
          dataValue: tab.getAttribute('data-value'),
          state: tab.getAttribute('data-state'),
          id: tab.id
        }))
      };
    });
    
    console.log('📋 Tabs info:', JSON.stringify(tabsInfo, null, 2));
    
    // Test clicking each tab with proper error handling
    const tabNames = ['Översikt', 'Partners', 'Referrals', 'Kickbacks', 'Analytics'];
    
    for (let i = 0; i < tabNames.length; i++) {
      console.log(`\n🔄 Testing ${tabNames[i]} tab (index ${i})...`);
      
      try {
        // Click the tab
        await page.evaluate((index) => {
          const tabs = document.querySelectorAll('[role="tab"]');
          if (tabs[index]) {
            tabs[index].click();
            return true;
          }
          return false;
        }, i);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check state
        const state = await page.evaluate(() => {
          const activeTab = document.querySelector('[role="tab"][data-state="active"]');
          const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
          const allTabs = document.querySelectorAll('[role="tab"]');
          
          return {
            activeTabText: activeTab ? activeTab.textContent : 'none',
            activeTabIndex: activeTab ? Array.from(allTabs).indexOf(activeTab) : -1,
            activePanelExists: activePanel !== null,
            pageIntact: document.querySelector('[role="tablist"]') !== null
          };
        }).catch(err => ({ error: err.message }));
        
        console.log(`📋 State after clicking ${tabNames[i]}:`, state);
        
        if (state.error || !state.pageIntact) {
          console.log(`❌ Tab ${tabNames[i]} caused page to crash!`);
          break;
        }
        
      } catch (err) {
        console.log(`❌ Error testing ${tabNames[i]}:`, err.message);
        break;
      }
    }
    
    // Final check
    const finalCheck = await page.evaluate(() => {
      return {
        pageIntact: document.body.innerHTML.length > 1000,
        hasErrors: document.body.textContent.includes('Error')
      };
    }).catch(() => ({ pageIntact: false, hasErrors: true }));
    
    console.log('\n📋 Final check:', finalCheck);
    
    await page.screenshot({path: 'test-controlled-tabs.png'});
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({path: 'test-controlled-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testControlledTabs()
  .then(() => {
    console.log('🎉 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });