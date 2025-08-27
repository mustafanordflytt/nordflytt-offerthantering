const puppeteer = require('puppeteer');

async function testReferralsTab() {
  console.log('🧪 Testing Referrals tab...');
  
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
    
    // Click Referrals tab
    console.log('🔄 Clicking Referrals tab...');
    await page.evaluate(() => {
      const referralsTab = Array.from(document.querySelectorAll('[role="tab"]')).find(tab => 
        tab.textContent.includes('Referrals')
      );
      if (referralsTab) {
        referralsTab.click();
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if page is stable
    const pageCheck = await page.evaluate(() => {
      const debugDiv = document.querySelector('div.bg-red-100');
      return {
        hasDebug: debugDiv !== null,
        debugText: debugDiv ? debugDiv.textContent : 'not found',
        hasHeader: document.querySelector('h1') !== null,
        headerText: document.querySelector('h1')?.textContent || 'not found'
      };
    });
    
    console.log('📋 Page check after Referrals click:', pageCheck);
    
    await page.screenshot({path: 'test-referrals-tab.png'});
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({path: 'test-referrals-tab-error.png'});
  } finally {
    await browser.close();
  }
}

// Run the test
testReferralsTab()
  .then(() => {
    console.log('🎉 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });