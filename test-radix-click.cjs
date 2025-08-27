const puppeteer = require('puppeteer');

async function testRadixClick() {
  console.log('🧪 Testing Radix UI click handling...');
  
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
    
    // Try using Radix UI's internal API
    console.log('🔄 Attempting to trigger tab change via Radix API...');
    
    const clickResult = await page.evaluate(() => {
      // Find the Partners tab button
      const partnersTab = document.querySelector('#radix-\\«r0\\»-trigger-partners');
      
      if (partnersTab) {
        // Try multiple event triggers
        const results = [];
        
        // Method 1: Direct click
        results.push('direct-click');
        partnersTab.click();
        
        // Method 2: Mouse events
        results.push('mouse-events');
        partnersTab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        partnersTab.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        partnersTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        
        // Method 3: Keyboard events (space/enter)
        results.push('keyboard-events');
        partnersTab.focus();
        partnersTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        partnersTab.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        
        // Method 4: Focus and trigger
        results.push('focus-trigger');
        partnersTab.focus();
        partnersTab.setAttribute('aria-selected', 'true');
        partnersTab.setAttribute('data-state', 'active');
        
        return { success: true, methods: results };
      }
      
      return { success: false, reason: 'Tab not found' };
    });
    
    console.log('🔄 Click result:', clickResult);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if state changed
    const stateAfterClick = await page.evaluate(() => {
      return {
        partnersTab: {
          state: document.querySelector('#radix-\\«r0\\»-trigger-partners')?.getAttribute('data-state'),
          ariaSelected: document.querySelector('#radix-\\«r0\\»-trigger-partners')?.getAttribute('aria-selected')
        },
        partnersPanel: {
          state: document.querySelector('#radix-\\«r0\\»-content-partners')?.getAttribute('data-state'),
          hidden: document.querySelector('#radix-\\«r0\\»-content-partners')?.hidden
        }
      };
    });
    
    console.log('📋 State after click:', stateAfterClick);
    
    // Try to manually update the DOM to see if the components would work
    console.log('🔧 Attempting manual DOM update...');
    
    const manualUpdate = await page.evaluate(() => {
      // Find all tabs and panels
      const allTabs = document.querySelectorAll('[role="tab"]');
      const allPanels = document.querySelectorAll('[role="tabpanel"]');
      
      // Find specific partners elements
      const partnersTab = document.querySelector('#radix-\\«r0\\»-trigger-partners');
      const partnersPanel = document.querySelector('#radix-\\«r0\\»-content-partners');
      
      if (partnersTab && partnersPanel) {
        // Update all tabs to inactive
        allTabs.forEach(tab => {
          tab.setAttribute('data-state', 'inactive');
          tab.setAttribute('aria-selected', 'false');
        });
        
        // Update all panels to inactive
        allPanels.forEach(panel => {
          panel.setAttribute('data-state', 'inactive');
          panel.hidden = true;
        });
        
        // Activate partners tab and panel
        partnersTab.setAttribute('data-state', 'active');
        partnersTab.setAttribute('aria-selected', 'true');
        partnersPanel.setAttribute('data-state', 'active');
        partnersPanel.hidden = false;
        
        return { success: true };
      }
      
      return { success: false, reason: 'Elements not found' };
    });
    
    console.log('🔧 Manual update result:', manualUpdate);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({path: 'test-radix-click.png'});
    
    // Check final state
    const finalState = await page.evaluate(() => {
      return {
        partnersVisible: !document.querySelector('#radix-\\«r0\\»-content-partners')?.hidden,
        overviewVisible: !document.querySelector('#radix-\\«r0\\»-content-overview')?.hidden,
        partnersContent: document.querySelector('#radix-\\«r0\\»-content-partners')?.textContent?.substring(0, 100)
      };
    });
    
    console.log('📋 Final state:', finalState);
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({path: 'test-radix-click-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testRadixClick()
  .then(() => {
    console.log('🎉 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });