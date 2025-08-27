const puppeteer = require('puppeteer');

async function debugTabSwitching() {
  console.log('🧪 Debugging tab switching mechanism...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set up detailed error logging
  page.on('console', msg => {
    console.log('🔍 Console:', msg.type(), msg.text());
  });
  
  page.on('pageerror', error => {
    console.error('🚨 Page error:', error.message);
  });
  
  try {
    // Navigate to samarbeten page
    console.log('📍 Navigating to Samarbeten...');
    await page.goto('http://localhost:3000/crm/samarbeten', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if Tabs component is using controlled state
    const tabsRoot = await page.evaluate(() => {
      const tabsElement = document.querySelector('[data-orientation="horizontal"]');
      return {
        exists: tabsElement !== null,
        defaultValue: tabsElement ? tabsElement.getAttribute('data-default-value') : null,
        value: tabsElement ? tabsElement.getAttribute('data-value') : null,
        orientation: tabsElement ? tabsElement.getAttribute('data-orientation') : null
      };
    });
    
    console.log('🔧 Tabs root element:', tabsRoot);
    
    // Check initial tab state in detail
    const initialState = await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      const panels = document.querySelectorAll('[role="tabpanel"]');
      
      return {
        tabs: Array.from(tabs).map(tab => ({
          text: tab.textContent,
          value: tab.getAttribute('data-value'),
          state: tab.getAttribute('data-state'),
          disabled: tab.getAttribute('data-disabled'),
          orientation: tab.getAttribute('data-orientation')
        })),
        panels: Array.from(panels).map(panel => ({
          value: panel.getAttribute('data-value'),
          state: panel.getAttribute('data-state'),
          orientation: panel.getAttribute('data-orientation')
        }))
      };
    });
    
    console.log('📋 Initial state:', JSON.stringify(initialState, null, 2));
    
    // Try clicking Partners tab with force
    console.log('🔄 Clicking Partners tab...');
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      const partnersTab = Array.from(tabs).find(tab => tab.textContent.includes('Partners'));
      if (partnersTab) {
        console.log('Found Partners tab, clicking...');
        partnersTab.click();
        partnersTab.dispatchEvent(new Event('click', { bubbles: true }));
        // Also try focus and keypress
        partnersTab.focus();
        partnersTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check state after click
    const afterClickState = await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      const panels = document.querySelectorAll('[role="tabpanel"]');
      
      return {
        tabs: Array.from(tabs).map(tab => ({
          text: tab.textContent,
          value: tab.getAttribute('data-value'),
          state: tab.getAttribute('data-state'),
          disabled: tab.getAttribute('data-disabled')
        })),
        panels: Array.from(panels).map(panel => ({
          value: panel.getAttribute('data-value'),
          state: panel.getAttribute('data-state')
        }))
      };
    });
    
    console.log('📋 After click state:', JSON.stringify(afterClickState, null, 2));
    
    // Check if React state is updating
    const reactState = await page.evaluate(() => {
      // Try to find React fiber node
      const tabsRoot = document.querySelector('[data-orientation="horizontal"]');
      if (tabsRoot) {
        const reactFiber = Object.keys(tabsRoot).find(key => key.startsWith('__reactFiber'));
        if (reactFiber) {
          const fiber = tabsRoot[reactFiber];
          return {
            fiberExists: true,
            memoizedProps: fiber.memoizedProps ? Object.keys(fiber.memoizedProps) : [],
            memoizedState: fiber.memoizedState ? 'has state' : 'no state'
          };
        }
      }
      return { fiberExists: false };
    });
    
    console.log('⚛️ React state:', reactState);
    
    // Try manual state change
    console.log('🔧 Attempting manual state change...');
    await page.evaluate(() => {
      // Try to find and manually trigger tab change
      const tabsRoot = document.querySelector('[data-orientation="horizontal"]');
      if (tabsRoot) {
        tabsRoot.setAttribute('data-value', 'partners');
        
        // Update tab states manually
        const tabs = document.querySelectorAll('[role="tab"]');
        const panels = document.querySelectorAll('[role="tabpanel"]');
        
        tabs.forEach(tab => {
          const value = tab.getAttribute('data-value');
          tab.setAttribute('data-state', value === 'partners' ? 'active' : 'inactive');
        });
        
        panels.forEach(panel => {
          const value = panel.getAttribute('data-value');
          panel.setAttribute('data-state', value === 'partners' ? 'active' : 'inactive');
        });
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({path: 'debug-manual-state.png'});
    
    console.log('✅ Debug completed');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await page.screenshot({path: 'debug-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the debug
debugTabSwitching()
  .then(() => {
    console.log('🎉 Debug finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });