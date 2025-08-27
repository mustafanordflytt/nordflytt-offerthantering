const puppeteer = require('puppeteer');

async function testJSErrors() {
  console.log('🧪 Testing for JavaScript errors...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Collect all console messages
  const messages = [];
  page.on('console', msg => {
    messages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Collect page errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  // Collect request failures
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });
  
  try {
    // Navigate to samarbeten page
    await page.goto('http://localhost:3000/crm/samarbeten', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if React is loaded and working
    const reactCheck = await page.evaluate(() => {
      return {
        reactVersion: typeof React !== 'undefined' ? React.version : 'not found',
        reactDOMVersion: typeof ReactDOM !== 'undefined' ? ReactDOM.version : 'not found',
        hasReactDevTools: typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined',
        reactErrors: window.__REACT_ERROR_OVERLAY__ ? 'has error overlay' : 'no error overlay'
      };
    });
    
    console.log('⚛️ React check:', reactCheck);
    
    // Check if tabs component has event listeners
    const tabsCheck = await page.evaluate(() => {
      const partnersTab = document.querySelector('[role="tab"]');
      if (partnersTab) {
        // Check if tab has event listeners
        const listeners = getEventListeners ? getEventListeners(partnersTab) : 'getEventListeners not available';
        
        return {
          tabExists: true,
          hasClickListener: partnersTab.onclick !== null,
          hasEventListeners: typeof listeners === 'object' && listeners.click ? listeners.click.length : 'unknown',
          tabId: partnersTab.id,
          tabText: partnersTab.textContent
        };
      }
      return { tabExists: false };
    });
    
    console.log('📋 Tabs check:', tabsCheck);
    
    // Try to trigger click programmatically and check for errors
    console.log('🔄 Testing programmatic click...');
    
    const clickTest = await page.evaluate(() => {
      try {
        const partnersTab = Array.from(document.querySelectorAll('[role="tab"]')).find(tab => 
          tab.textContent.includes('Partners')
        );
        
        if (partnersTab) {
          // Add temporary event listener to catch clicks
          let clickCaught = false;
          const tempListener = () => { clickCaught = true; };
          partnersTab.addEventListener('click', tempListener);
          
          // Click the tab
          partnersTab.click();
          
          // Remove temporary listener
          partnersTab.removeEventListener('click', tempListener);
          
          return {
            success: true,
            clickCaught: clickCaught,
            tabState: partnersTab.getAttribute('data-state'),
            ariaSelected: partnersTab.getAttribute('aria-selected')
          };
        }
        
        return { success: false, reason: 'Tab not found' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('🔄 Click test result:', clickTest);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Log all collected messages and errors
    console.log('📝 Console messages:', messages.filter(m => m.type === 'error' || m.type === 'warn'));
    console.log('🚨 Page errors:', errors);
    console.log('🔥 Failed requests:', failedRequests);
    
    await page.screenshot({path: 'test-js-errors.png'});
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({path: 'test-js-errors-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testJSErrors()
  .then(() => {
    console.log('🎉 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });