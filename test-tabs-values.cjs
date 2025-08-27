const puppeteer = require('puppeteer');

async function testTabsValues() {
  console.log('🧪 Testing tabs values...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to samarbeten page
    await page.goto('http://localhost:3000/crm/samarbeten', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check the actual HTML structure
    const tabsHTML = await page.evaluate(() => {
      const tabsContainer = document.querySelector('[data-orientation="horizontal"]');
      return {
        tabsContainerHTML: tabsContainer ? tabsContainer.outerHTML.substring(0, 500) : 'not found',
        tabsButtons: Array.from(document.querySelectorAll('[role="tab"]')).map(tab => ({
          text: tab.textContent,
          value: tab.getAttribute('value'),
          dataValue: tab.getAttribute('data-value'),
          outerHTML: tab.outerHTML.substring(0, 200)
        })),
        tabPanels: Array.from(document.querySelectorAll('[role="tabpanel"]')).map(panel => ({
          value: panel.getAttribute('value'),
          dataValue: panel.getAttribute('data-value'),
          outerHTML: panel.outerHTML.substring(0, 200)
        }))
      };
    });
    
    console.log('📋 Tabs HTML structure:', JSON.stringify(tabsHTML, null, 2));
    
    // Try to click using the actual HTML structure
    console.log('🔄 Attempting to click Partners tab using selector...');
    
    // Try different selectors
    const clickResult = await page.evaluate(() => {
      // Try multiple ways to find and click the Partners tab
      const attempts = [];
      
      // Attempt 1: Find by text content
      const tabsByText = Array.from(document.querySelectorAll('[role="tab"]')).find(tab => 
        tab.textContent.includes('Partners')
      );
      if (tabsByText) {
        attempts.push({ method: 'text', found: true });
        tabsByText.click();
      } else {
        attempts.push({ method: 'text', found: false });
      }
      
      // Attempt 2: Find by data-value (if it exists)
      const tabsByDataValue = document.querySelector('[role="tab"][data-value="partners"]');
      if (tabsByDataValue) {
        attempts.push({ method: 'data-value', found: true });
        tabsByDataValue.click();
      } else {
        attempts.push({ method: 'data-value', found: false });
      }
      
      // Attempt 3: Find by value attribute
      const tabsByValue = document.querySelector('[role="tab"][value="partners"]');
      if (tabsByValue) {
        attempts.push({ method: 'value', found: true });
        tabsByValue.click();
      } else {
        attempts.push({ method: 'value', found: false });
      }
      
      return attempts;
    });
    
    console.log('🔄 Click attempts:', clickResult);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check state after attempts
    const finalState = await page.evaluate(() => {
      return {
        tabs: Array.from(document.querySelectorAll('[role="tab"]')).map(tab => ({
          text: tab.textContent,
          state: tab.getAttribute('data-state'),
          ariaSelected: tab.getAttribute('aria-selected')
        })),
        panels: Array.from(document.querySelectorAll('[role="tabpanel"]')).map(panel => ({
          state: panel.getAttribute('data-state'),
          hidden: panel.hidden
        }))
      };
    });
    
    console.log('📋 Final state:', JSON.stringify(finalState, null, 2));
    
    await page.screenshot({path: 'test-tabs-values.png'});
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({path: 'test-tabs-values-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testTabsValues()
  .then(() => {
    console.log('🎉 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });