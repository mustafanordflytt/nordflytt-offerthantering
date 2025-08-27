const puppeteer = require('puppeteer');

async function testDebugTabs() {
  console.log('🧪 Testing tabs with debug info...');
  
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
  
  try {
    // Navigate to samarbeten page
    await page.goto('http://localhost:3000/crm/samarbeten', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check debug display
    const debugInfo = await page.evaluate(() => {
      const debugDiv = document.querySelector('div.bg-red-100');
      return debugDiv ? debugDiv.textContent : 'Debug div not found';
    });
    
    console.log('📋 Debug info:', debugInfo);
    
    await page.screenshot({path: 'test-debug-before.png'});
    
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
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check debug display after click
    const debugInfoAfter = await page.evaluate(() => {
      const debugDiv = document.querySelector('div.bg-red-100');
      return debugDiv ? debugDiv.textContent : 'Debug div not found';
    });
    
    console.log('📋 Debug info after click:', debugInfoAfter);
    
    await page.screenshot({path: 'test-debug-after.png'});
    
    // Check if Partners content is now visible
    const contentCheck = await page.evaluate(() => {
      const partnersContent = document.querySelector('[role="tabpanel"][data-state="active"]');
      return {
        activePanel: partnersContent ? partnersContent.getAttribute('aria-labelledby') : 'none',
        hasPartnersManager: document.body.innerHTML.includes('PartnersManager'),
        partnersContentLength: partnersContent ? partnersContent.textContent.length : 0
      };
    });
    
    console.log('📄 Content check:', contentCheck);
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({path: 'test-debug-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testDebugTabs()
  .then(() => {
    console.log('🎉 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });