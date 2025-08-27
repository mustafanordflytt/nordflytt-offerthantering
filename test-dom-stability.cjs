const puppeteer = require('puppeteer');

async function testDOMStability() {
  console.log('🧪 Testing DOM stability...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Monitor console logs
  page.on('console', msg => {
    console.log('🔍 Console:', msg.text());
  });
  
  // Monitor DOM mutations
  page.on('domcontentloaded', () => {
    console.log('📄 DOM content loaded');
  });
  
  try {
    // Navigate to samarbeten page
    await page.goto('http://localhost:3000/crm/samarbeten', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if debug div exists before click
    const debugBefore = await page.evaluate(() => {
      const debugDiv = document.querySelector('div.bg-red-100');
      return {
        exists: debugDiv !== null,
        text: debugDiv ? debugDiv.textContent : 'not found',
        outerHTML: debugDiv ? debugDiv.outerHTML : 'not found'
      };
    });
    
    console.log('📋 Debug before click:', debugBefore);
    
    // Add DOM mutation observer
    await page.evaluate(() => {
      window.mutationLog = [];
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.target.classList.contains('bg-red-100')) {
            window.mutationLog.push({
              type: 'childList',
              target: mutation.target.className,
              addedNodes: mutation.addedNodes.length,
              removedNodes: mutation.removedNodes.length
            });
          }
        });
      });
      
      const debugDiv = document.querySelector('div.bg-red-100');
      if (debugDiv) {
        observer.observe(debugDiv, { childList: true, subtree: true });
        observer.observe(debugDiv.parentNode, { childList: true, subtree: true });
      }
    });
    
    // Click Partners tab
    console.log('🔄 Clicking Partners tab...');
    await page.evaluate(() => {
      const partnersTab = Array.from(document.querySelectorAll('[role="tab"]')).find(tab => 
        tab.textContent.includes('Partners')
      );
      if (partnersTab) {
        partnersTab.click();
      }
    });
    
    // Wait and check immediately
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const debugAfter500ms = await page.evaluate(() => {
      const debugDiv = document.querySelector('div.bg-red-100');
      return {
        exists: debugDiv !== null,
        text: debugDiv ? debugDiv.textContent : 'not found',
        mutations: window.mutationLog || []
      };
    });
    
    console.log('📋 Debug after 500ms:', debugAfter500ms);
    
    // Wait longer and check again
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const debugAfter3s = await page.evaluate(() => {
      const debugDiv = document.querySelector('div.bg-red-100');
      return {
        exists: debugDiv !== null,
        text: debugDiv ? debugDiv.textContent : 'not found',
        mutations: window.mutationLog || []
      };
    });
    
    console.log('📋 Debug after 3s:', debugAfter3s);
    
    // Check if entire page structure changed
    const pageStructure = await page.evaluate(() => {
      return {
        hasHeader: document.querySelector('h1') !== null,
        headerText: document.querySelector('h1')?.textContent || 'not found',
        hasTabsList: document.querySelector('[role="tablist"]') !== null,
        tabsCount: document.querySelectorAll('[role="tab"]').length,
        tabsText: Array.from(document.querySelectorAll('[role="tab"]')).map(tab => tab.textContent)
      };
    });
    
    console.log('📋 Page structure:', pageStructure);
    
    await page.screenshot({path: 'test-dom-stability.png'});
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({path: 'test-dom-stability-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testDOMStability()
  .then(() => {
    console.log('🎉 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });